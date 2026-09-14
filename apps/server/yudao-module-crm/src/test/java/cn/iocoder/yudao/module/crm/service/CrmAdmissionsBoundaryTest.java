package cn.iocoder.yudao.module.crm.service;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import cn.iocoder.yudao.module.crm.controller.admin.permission.vo.CrmPermissionUpdateReqVO;
import cn.iocoder.yudao.module.crm.dal.dataobject.permission.CrmPermissionDO;
import cn.iocoder.yudao.module.crm.dal.mysql.permission.CrmPermissionMapper;
import cn.iocoder.yudao.module.crm.service.approval.*;
import cn.iocoder.yudao.module.crm.service.permission.CrmPermissionServiceImpl;
import cn.iocoder.yudao.module.crm.service.clue.CrmClueServiceImpl;
import cn.iocoder.yudao.module.crm.controller.admin.clue.vo.CrmClueSaveReqVO;
import cn.iocoder.yudao.module.crm.dal.dataobject.clue.CrmClueDO;
import cn.iocoder.yudao.module.crm.dal.mysql.clue.CrmClueMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class CrmAdmissionsBoundaryTest {
    @Test void genericCrmEditingCannotAcceptOrOverwriteAppointmentFacts() throws Exception {
        for (String field : List.of("educationServiceType","educationTeacherId","educationTeacherName",
                "educationPreferredStartTime","educationPreferredEndTime","educationAppointmentStatus")) {
            assertThrows(NoSuchFieldException.class, () -> CrmClueSaveReqVO.class.getDeclaredField(field));
            var annotation = CrmClueDO.class.getDeclaredField(field).getAnnotation(com.baomidou.mybatisplus.annotation.TableField.class);
            assertNotNull(annotation);
            assertEquals(com.baomidou.mybatisplus.annotation.FieldStrategy.NEVER, annotation.updateStrategy());
        }
    }
    @Test void editingClueCannotBypassOriginalOwnerTransfer() {
        var service = new CrmClueServiceImpl(); var mapper = mock(CrmClueMapper.class);
        ReflectionTestUtils.setField(service, "clueMapper", mapper);
        when(mapper.selectById(7L)).thenReturn(new CrmClueDO().setId(7L).setOwnerUserId(10L));
        assertThrows(ServiceException.class, () -> service.updateClue(new CrmClueSaveReqVO().setId(7L).setOwnerUserId(20L)));
        verify(mapper, never()).updateById(any(CrmClueDO.class));
    }
    @Test void approvalIsUnavailableWithoutOriginalBpmAdapter() {
        var service = new CrmApprovalService();
        ObjectProvider<CrmApprovalBridge> bridges = mock(ObjectProvider.class);
        ReflectionTestUtils.setField(service, "bridges", bridges);
        assertThrows(ServiceException.class, () -> service.createProcessInstance(1L, "crm-contract", "7"));
        assertThrows(ServiceException.class, () -> service.toAuditStatus(2));
    }
    @Test void forgedBusinessIdCannotEditAnotherCluesPermission() {
        var service = new CrmPermissionServiceImpl(); var mapper = mock(CrmPermissionMapper.class);
        ReflectionTestUtils.setField(service, "permissionMapper", mapper);
        when(mapper.selectByIds(anyCollection())).thenReturn(List.of(new CrmPermissionDO().setId(7L).setBizType(1).setBizId(20L).setLevel(2)));
        var request = new CrmPermissionUpdateReqVO().setIds(List.of(7L)).setBizType(1).setBizId(10L).setLevel(3);
        assertThrows(ServiceException.class, () -> service.updatePermission(request));
        verify(mapper, never()).updateBatch(anyCollection());
    }
    @Test void editingMembershipCannotCreateOrDemoteAnOwner() {
        var service = new CrmPermissionServiceImpl(); var mapper = mock(CrmPermissionMapper.class);
        ReflectionTestUtils.setField(service, "permissionMapper", mapper);
        when(mapper.selectByIds(anyCollection())).thenReturn(List.of(new CrmPermissionDO().setId(7L).setBizType(1).setBizId(10L).setLevel(1)));
        var request = new CrmPermissionUpdateReqVO().setIds(List.of(7L)).setBizType(1).setBizId(10L).setLevel(3);
        assertThrows(ServiceException.class, () -> service.updatePermission(request));
        verify(mapper, never()).updateBatch(anyCollection());
    }
}
