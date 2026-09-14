package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import cn.iocoder.yudao.module.crm.dal.dataobject.clue.CrmClueDO;
import cn.iocoder.yudao.module.crm.dal.mysql.clue.CrmClueMapper;
import cn.iocoder.yudao.module.crm.service.clue.CrmClueService;
import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.infra.api.config.ConfigApi;
import cn.iocoder.yudao.module.system.api.user.AdminUserApi;
import cn.iocoder.yudao.module.system.api.user.dto.AdminUserRespDTO;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EduOneToOneAdmissionTest {
    private final EduAdmissionService service = new EduAdmissionService();
    private final EduAccessService access = mock(EduAccessService.class);
    private final EduStudentMapper students = mock(EduStudentMapper.class);
    private final CrmClueMapper mapper = mock(CrmClueMapper.class);
    private final CrmClueService clues = mock(CrmClueService.class);
    private final EduTeacherService teacherDirectory = mock(EduTeacherService.class);
    private final ConfigApi config = mock(ConfigApi.class);
    private final AdminUserApi users = mock(AdminUserApi.class);
    private final EduTrialBookingMapper trials = mock(EduTrialBookingMapper.class);
    private final LocalDateTime start = LocalDateTime.now(ZoneId.of("Asia/Shanghai")).plusDays(2).withSecond(0).withNano(0);

    @BeforeEach void setup() {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), CrmClueDO.class);
        for (var entry : Map.of("access",access,"students",students,"clueMapper",mapper,"clues",clues,
                "teacherDirectory",teacherDirectory,"config",config,"users",users,"trials",trials).entrySet())
            ReflectionTestUtils.setField(service, entry.getKey(), entry.getValue());
        when(access.actor()).thenReturn(10L);
        when(students.selectOneForUpdate(any(),eq(20L))).thenReturn(new EduStudentDO().setId(20L).setGuardianMemberId(10L).setName("孩子"));
        when(config.getConfigValueByKey(EduAdmissionService.OWNER_CONFIG_KEY)).thenReturn("100");
        when(users.getUser(100L)).thenReturn(new AdminUserRespDTO().setId(100L).setStatus(0));
        when(teacherDirectory.requireOneToOne(30L)).thenReturn(new EduTeacherProfileDO().setId(30L).setName("原始教师名"));
        when(trials.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
    }
    private CrmClueDO row(String status) {
        return new CrmClueDO().setId(40L).setEducationMemberId(10L).setEducationStudentId(20L)
                .setEducationServiceType("ONE_TO_ONE").setEducationTeacherId(30L).setEducationTeacherName("原始教师名")
                .setEducationPreferredStartTime(start).setEducationPreferredEndTime(start.plusMinutes(60))
                .setEducationAppointmentStatus(status);
    }
    private Map<String,Object> create(String message, Long trialId) {
        return service.create(20L,null,"家长","13900000001",message,true,EduAdmissionService.CONSENT_VERSION,
                trialId,"ONE_TO_ONE",30L,start.toString(),start.plusMinutes(60).toString());
    }
    @Test void durationUsesExactBoundsAndRejectsPastOrSubMinuteTimes() {
        var now = LocalDateTime.of(2026,9,14,10,0);
        assertDoesNotThrow(() -> EduAdmissionService.validatePreferredTime(now.plusHours(1),now.plusMinutes(90),now));
        assertDoesNotThrow(() -> EduAdmissionService.validatePreferredTime(now.plusHours(1),now.plusHours(4),now));
        for (var end : List.of(now.plusMinutes(89),now.plusHours(4).plusMinutes(1),now))
            assertThrows(ServiceException.class,() -> EduAdmissionService.validatePreferredTime(now.plusHours(1),end,now));
        assertThrows(ServiceException.class,() -> EduAdmissionService.validatePreferredTime(now,now.plusHours(1),now));
        assertThrows(ServiceException.class,() -> EduAdmissionService.validatePreferredTime(now.plusHours(1),now.plusMinutes(90).plusSeconds(1),now));
    }
    @Test void missingLearningGoalAndTrialAssociationFailBeforeWrites() {
        assertThrows(ServiceException.class,() -> create(" ",null));
        assertThrows(ServiceException.class,() -> create("制作个人网站",5L));
        verifyNoInteractions(clues,mapper,teacherDirectory);
    }
    @Test void duplicateRequestIncludesTeacherAndTimeWithoutCreatingAnotherLead() {
        when(mapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(row("REQUESTED")));
        // An earlier REPEATABLE READ snapshot cannot see the winning transaction's row.
        when(mapper.selectById(40L)).thenReturn(null);
        when(mapper.selectOneForUpdate(any(),eq(40L))).thenReturn(row("REQUESTED"));
        var response = create("制作个人网站",null);
        assertEquals(40L,response.get("id")); assertEquals("原始教师名",response.get("teacherName"));
        ArgumentCaptor<LambdaQueryWrapper<CrmClueDO>> query = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(mapper).selectList(query.capture());
        String sql = query.getValue().getSqlSegment();
        assertTrue(sql.contains("education_teacher_id")); assertTrue(sql.contains("education_preferred_start_time"));
        assertTrue(sql.contains("education_preferred_end_time")); assertTrue(sql.contains("education_appointment_status"));
        assertTrue(sql.endsWith("LIMIT 1 FOR UPDATE"), "Queued requests require a current read after the student lock, not an earlier REPEATABLE READ snapshot");
        assertFalse(sql.contains("follow_up_status"));
        verify(mapper,never()).selectById(40L);
        verifyNoInteractions(clues);
    }
    @Test void cancellationChecksGuardianBeforeReadingPrivateStudentOrChangingLead() {
        when(mapper.selectById(40L)).thenReturn(row("REQUESTED").setEducationMemberId(99L));
        assertThrows(ServiceException.class,() -> service.cancel(40L));
        verify(access,never()).ownStudent(anyLong()); verifyNoInteractions(students);
        verify(mapper,never()).update(isNull(),any());
    }
    @Test void cancellationIsIdempotentAndPreservesTeacherSnapshot() {
        var row = row("REQUESTED");
        when(mapper.selectById(40L)).thenReturn(row);
        when(mapper.selectOneForUpdate(any(),eq(40L))).thenReturn(row);
        assertEquals("CANCELLED",service.cancel(40L).get("appointmentStatus"));
        assertEquals("原始教师名",service.cancel(40L).get("teacherName"));
        verify(mapper,times(1)).update(isNull(),any()); verifyNoInteractions(teacherDirectory,clues);
    }
    @Test void ordinaryCourseConsultationCannotUseAppointmentWithdrawalOrTeacherFields() {
        var row = row(null).setEducationServiceType(null);
        when(mapper.selectById(40L)).thenReturn(row);
        when(mapper.selectOneForUpdate(any(),eq(40L))).thenReturn(row);
        assertThrows(ServiceException.class,() -> service.cancel(40L));
        assertThrows(ServiceException.class,() -> service.create(20L,null,"家长","13900000001","目标",true,
                EduAdmissionService.CONSENT_VERSION,null,null,30L,null,null));
        verify(mapper,never()).update(isNull(),any());
    }
    @Test void oneToOneRequestCannotBeLinkedThroughLegacyTrialEndpoint() {
        when(mapper.selectById(40L)).thenReturn(row("REQUESTED"));
        assertThrows(ServiceException.class,() -> service.linkTrial(40L,50L));
        verifyNoInteractions(trials);
    }
    @Test void teacherMustBePublishedEnabledAndLinkedToActiveOriginalStaff() {
        var directory = new EduTeacherService();
        ReflectionTestUtils.setField(directory,"users",users);
        var teacher = new EduTeacherProfileDO().setId(30L).setUserId(100L).setBio("专业老师")
                .setStatus("PUBLISHED").setOneToOneEnabled(true);
        assertTrue(directory.acceptsOneToOne(teacher));
        assertFalse(directory.acceptsOneToOne(teacher.setOneToOneEnabled(false)));
        assertFalse(directory.acceptsOneToOne(teacher.setOneToOneEnabled(true).setStatus("DRAFT")));
        assertFalse(directory.acceptsOneToOne(teacher.setStatus("PUBLISHED").setBio(" ")));
        when(users.getUser(100L)).thenReturn(new AdminUserRespDTO().setId(100L).setStatus(1));
        assertFalse(directory.acceptsOneToOne(teacher.setBio("专业老师")));
    }
}
