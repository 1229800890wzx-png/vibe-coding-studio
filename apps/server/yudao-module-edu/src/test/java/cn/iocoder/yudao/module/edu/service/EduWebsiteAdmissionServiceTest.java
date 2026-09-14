package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder;
import cn.iocoder.yudao.module.crm.dal.mysql.clue.CrmClueMapper;
import cn.iocoder.yudao.module.crm.service.clue.CrmClueService;
import cn.iocoder.yudao.module.edu.controller.app.vo.EduWebsiteAdmissionCreateReqVO;
import cn.iocoder.yudao.module.edu.dal.dataobject.EduWebsiteAdmissionReceiptDO;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.infra.api.config.ConfigApi;
import cn.iocoder.yudao.module.system.dal.mysql.user.AdminUserMapper;
import cn.iocoder.yudao.module.system.dal.dataobject.user.AdminUserDO;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import cn.iocoder.yudao.module.crm.dal.dataobject.clue.CrmClueDO;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.*;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.*;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.dao.DuplicateKeyException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EduWebsiteAdmissionServiceTest {
    final EduWebsiteAdmissionService service = new EduWebsiteAdmissionService();
    final EduWebsiteAdmissionReceiptMapper receipts = mock(EduWebsiteAdmissionReceiptMapper.class);
    final CrmClueService clues = mock(CrmClueService.class);
    final CrmClueMapper clueMapper = mock(CrmClueMapper.class);
    final EduCourseMapper courses = mock(EduCourseMapper.class);
    final ConfigApi config = mock(ConfigApi.class);
    final AdminUserMapper users = mock(AdminUserMapper.class);
    final EduWebsiteAdmissionTraffic traffic = mock(EduWebsiteAdmissionTraffic.class);
    final PlatformTransactionManager transactions = mock(PlatformTransactionManager.class);
    final MockHttpServletRequest request = new MockHttpServletRequest();

    @BeforeEach void setup() {
        TenantContextHolder.setTenantId(1L);
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), CrmClueDO.class);
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), EduWebsiteAdmissionReceiptDO.class);
        Map<String,Object> dependencies = new HashMap<>();
        dependencies.put("receipts", receipts); dependencies.put("clues", clues); dependencies.put("clueMapper", clueMapper);
        dependencies.put("courses", courses); dependencies.put("config", config); dependencies.put("users", users);
        dependencies.put("traffic", traffic); dependencies.put("transactionManager", transactions);
        dependencies.put("expectedTenant", 1L); dependencies.put("consentVersion", "v1");
        dependencies.forEach((key,value) -> ReflectionTestUtils.setField(service,key,value));
        when(transactions.getTransaction(any())).thenAnswer(call -> new SimpleTransactionStatus());
    }
    @AfterEach void clear() { TenantContextHolder.clear(); }

    static EduWebsiteAdmissionCreateReqVO body() {
        return new EduWebsiteAdmissionCreateReqVO().setRequestId("request-1234567890").setContactName("访客")
                .setContactType("MOBILE").setContact("13800138000").setExperience("零基础").setInterest("机器人")
                .setMessage("周末联系").setContactConsent(true).setConsentVersion("v1");
    }
    static EduWebsiteAdmissionReceiptDO receipt(EduWebsiteAdmissionCreateReqVO body) {
        return new EduWebsiteAdmissionReceiptDO().setReceipt("opaque-receipt").setPayloadDigest(EduWebsiteAdmissionService.digest(EduWebsiteAdmissionService.canonical(body)));
    }
    void enabledOwner() {
        when(config.getConfigValueByKey(EduAdmissionService.OWNER_CONFIG_KEY)).thenReturn("50");
        var owner = new AdminUserDO().setId(50L).setStatus(0); owner.setTenantId(1L);
        when(users.selectById(50L)).thenReturn(owner);
        when(clues.createWebsiteClue(any())).thenReturn(90L);
    }

    @Test void canonicalPayloadHasStableMeaningAndEveryFactChangesDigest() {
        var original = body();
        String digest = EduWebsiteAdmissionService.digest(EduWebsiteAdmissionService.canonical(original));
        assertEquals(digest, EduWebsiteAdmissionService.digest(EduWebsiteAdmissionService.canonical(body().setContactName(" 访客 ").setRequestId("another-123456789"))));
        for (var changed : List.of(body().setContact("13900139000"), body().setMessage("改天联系"), body().setExperience("有基础"),
                body().setInterest("动画"), body().setCourseId(3L), body().setContactConsent(false), body().setConsentVersion("v2")))
            assertNotEquals(digest, EduWebsiteAdmissionService.digest(EduWebsiteAdmissionService.canonical(changed)));
    }
    @Test void invalidKeysContactAndBoundsAreRejectedBeforeReceiptRead() {
        for (var invalid : List.of(body().setRequestId("a:b"), body().setContact("not-a-phone"), body().setContactType("OTHER"),
                body().setMessage("x".repeat(2001)), body().setContactName("  "), body().setCourseId(-1L)))
            assertThrows(ServiceException.class, () -> service.create(invalid, request));
        verifyNoInteractions(receipts, config, clues);
        assertDoesNotThrow(() -> EduWebsiteAdmissionService.canonical(body().setContactType("EMAIL").setContact("parent@example.org")));
        assertThrows(ServiceException.class, () -> EduWebsiteAdmissionService.canonical(body().setContactType("EMAIL").setContact("a@b")));
    }
    @Test void replayPrecedesAllMutableOwnerCourseConsentConditionsButFollowsTraffic() {
        var old = body().setCourseId(20L);
        when(receipts.selectOne(any(Wrapper.class))).thenReturn(receipt(old));
        ReflectionTestUtils.setField(service, "consentVersion", "v2");
        assertEquals(Map.of("receipt", "opaque-receipt", "status", "ACCEPTED"), service.create(old, request));
        var order = inOrder(traffic, receipts);
        order.verify(traffic).check("create", 1L, request); order.verify(receipts).selectOne(any(Wrapper.class));
        verifyNoInteractions(config, users, courses, clues, transactions);
    }
    @Test void conflictingReplayFailsAndWrongTenantNeverReadsReceipt() {
        when(receipts.selectOne(any(Wrapper.class))).thenReturn(receipt(body()));
        assertEquals(EduWebsiteAdmissionErrorCodes.REQUEST_CONFLICT,
                assertThrows(ServiceException.class, () -> service.create(body().setMessage("different"), request)).getCode());
        clearInvocations(receipts);
        TenantContextHolder.setTenantId(2L);
        assertThrows(ServiceException.class, () -> service.create(body(), request));
        verifyNoInteractions(receipts, clues);
    }
    @Test void newReceiptAndOwnerAreWithinOneRequiresNewTransaction() {
        enabledOwner();
        var result = service.create(body(), request);
        assertEquals(Set.of("receipt", "status"), result.keySet());
        assertEquals("ACCEPTED", result.get("status"));
        verify(clues).createWebsiteClue(argThat(clue -> clue.getOwnerUserId().equals(50L) && clue.getEmail() == null && clue.getMobile().equals("13800138000")));
        verify(clues, never()).createClue(any());
        verify(transactions).getTransaction(argThat(def -> def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRES_NEW));
        var order = inOrder(transactions, clues, receipts);
        order.verify(transactions).getTransaction(any());
        order.verify(clues).createWebsiteClue(any());
        order.verify(receipts).insert(any(EduWebsiteAdmissionReceiptDO.class));
        order.verify(transactions).commit(any());
    }
    @Test void duplicateInsertRollsBackBeforeReadingWinner() {
        enabledOwner();
        when(receipts.selectOne(any(Wrapper.class))).thenReturn(null, null, receipt(body()));
        doThrow(new DuplicateKeyException("unique request")).when(receipts).insert(any(EduWebsiteAdmissionReceiptDO.class));
        assertEquals("opaque-receipt", service.create(body(), request).get("receipt"));
        var order = inOrder(receipts, transactions);
        order.verify(receipts).insert(any(EduWebsiteAdmissionReceiptDO.class));
        order.verify(transactions).rollback(any());
        order.verify(transactions).getTransaction(any());
        order.verify(receipts).selectOne(any(Wrapper.class));
        order.verify(transactions).commit(any());
    }
    @Test void receiptFailureRollsBackEntireIntake() {
        enabledOwner();
        doThrow(new IllegalStateException("receipt unavailable")).when(receipts).insert(any(EduWebsiteAdmissionReceiptDO.class));
        assertThrows(IllegalStateException.class, () -> service.create(body(), request));
        verify(clues).createWebsiteClue(any());
        verify(transactions).rollback(any());
        verify(transactions, never()).commit(any());
    }
    @Test void admissionEndpointsKeepAccessMetadataWithoutContactOrNotesPayloads() {
        for (Class<?> controller : List.of(
                cn.iocoder.yudao.module.edu.controller.app.AppEduWebsiteAdmissionController.class,
                cn.iocoder.yudao.module.edu.controller.admin.EduWebsiteAdmissionController.class)) {
            for (var method : controller.getDeclaredMethods()) {
                if (!java.lang.reflect.Modifier.isPublic(method.getModifiers())) continue;
                var logging = method.getAnnotation(cn.iocoder.yudao.framework.apilog.core.annotation.ApiAccessLog.class);
                assertNotNull(logging, method.getName());
                assertTrue(logging.enable());
                assertFalse(logging.requestEnable());
                assertFalse(logging.responseEnable());
            }
        }
    }
    @Test void crmPermissionAndLoggingContractsRemainOnProxyMethods() throws Exception {
        var crmClass = cn.iocoder.yudao.module.crm.service.clue.CrmClueServiceImpl.class;
        var create = crmClass.getMethod("createClue", cn.iocoder.yudao.module.crm.controller.admin.clue.vo.CrmClueSaveReqVO.class);
        var anonymous = crmClass.getMethod("createWebsiteClue", cn.iocoder.yudao.module.crm.controller.admin.clue.vo.CrmClueSaveReqVO.class);
        var update = crmClass.getMethod("updateWebsiteAdmission", Long.class, String.class, String.class);
        assertNotNull(create.getAnnotation(com.mzt.logapi.starter.annotation.LogRecord.class));
        assertNull(anonymous.getAnnotation(com.mzt.logapi.starter.annotation.LogRecord.class));
        assertNotNull(update.getAnnotation(com.mzt.logapi.starter.annotation.LogRecord.class));
        assertEquals(cn.iocoder.yudao.module.crm.enums.permission.CrmPermissionLevelEnum.WRITE,
                update.getAnnotation(cn.iocoder.yudao.module.crm.framework.permission.core.annotations.CrmPermission.class).level());
        for (String name : List.of("educationOrigin", "educationWebsiteStatus", "educationOperatorNote", "educationMessage")) {
            assertThrows(NoSuchFieldException.class, () -> cn.iocoder.yudao.module.crm.controller.admin.clue.vo.CrmClueSaveReqVO.class.getDeclaredField(name));
            assertEquals(com.baomidou.mybatisplus.annotation.FieldStrategy.NEVER,
                    CrmClueDO.class.getDeclaredField(name).getAnnotation(com.baomidou.mybatisplus.annotation.TableField.class).updateStrategy());
        }
    }
    @Test void declinedAndOutdatedConsentUseStableCodeBeforeOwnerLookup() {
        for (var rejected : List.of(body().setContactConsent(false), body().setConsentVersion("v0"))) {
            assertEquals(EduWebsiteAdmissionErrorCodes.CONSENT_REQUIRED,
                    assertThrows(ServiceException.class, () -> service.create(rejected, request)).getCode());
        }
        verifyNoInteractions(config, users, clues);
        verify(transactions, times(2)).rollback(any());
    }
    @Test void pausedIntakeUsesStableCodeForAbsentAndInactiveOwner() {
        assertEquals(EduWebsiteAdmissionErrorCodes.INTAKE_UNAVAILABLE,
                assertThrows(ServiceException.class, () -> service.create(body(), request)).getCode());
        enabledOwner();
        var owner = new AdminUserDO().setId(50L).setStatus(1); owner.setTenantId(1L);
        when(users.selectById(50L)).thenReturn(owner);
        assertEquals(EduWebsiteAdmissionErrorCodes.INTAKE_UNAVAILABLE,
                assertThrows(ServiceException.class, () -> service.create(body(), request)).getCode());
        verify(clues, never()).createWebsiteClue(any());
    }
    @Test void crossTenantOwnerFailsAndDoesNotCreateClue() {
        enabledOwner();
        var owner = new AdminUserDO().setId(50L).setStatus(0); owner.setTenantId(2L);
        when(users.selectById(50L)).thenReturn(owner);
        assertThrows(ServiceException.class, () -> service.create(body(), request));
        verifyNoInteractions(clues);
        verify(transactions).rollback(any());
    }
    @Test void staffReadRejectsNonWebsiteAfterOriginalCrmReadAndUpdateDelegatesWrite() {
        when(clues.getClue(9L)).thenReturn(new CrmClueDO().setId(9L).setEducationOrigin("MINIAPP"));
        assertThrows(ServiceException.class, () -> service.get(9L));
        service.update(9L, "CONTACTED", "员工记录");
        verify(clues).updateWebsiteAdmission(9L, "CONTACTED", "员工记录");
    }
}
