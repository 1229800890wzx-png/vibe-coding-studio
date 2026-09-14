package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.system.api.permission.PermissionApi;
import cn.iocoder.yudao.framework.common.exception.ServiceException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class EduAccessServiceTest {
    @Test void knowingChildIdDoesNotGrantAccess(){
        EduAccessService service=spy(new EduAccessService());EduStudentMapper mapper=mock(EduStudentMapper.class);
        ReflectionTestUtils.setField(service,"students",mapper);doReturn(99L).when(service).actor();
        when(mapper.selectById(1L)).thenReturn(new EduStudentDO().setId(1L).setGuardianMemberId(100L));
        assertThrows(ServiceException.class,()->service.ownStudent(1L));
        when(mapper.selectById(2L)).thenReturn(new EduStudentDO().setId(2L).setGuardianMemberId(99L));
        assertEquals(2L,service.ownStudent(2L).getId());
    }
}
