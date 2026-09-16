package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.controller.vo.EduWebsiteOfferingCreateReqVO;
import cn.iocoder.yudao.module.edu.controller.vo.EduWebsiteOfferingPublishReqVO;
import cn.iocoder.yudao.module.edu.controller.vo.EduWebsiteOfferingUpdateReqVO;
import cn.iocoder.yudao.module.edu.dal.dataobject.EduCourseDO;
import cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder;
import cn.iocoder.yudao.framework.common.exception.ServiceException;
import org.junit.jupiter.api.AfterEach;
import cn.iocoder.yudao.module.edu.dal.dataobject.EduWebsiteOfferingDO;
import cn.iocoder.yudao.module.edu.dal.mysql.EduCourseMapper;
import cn.iocoder.yudao.module.edu.dal.mysql.EduWebsiteOfferingMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EduWebsiteOfferingServiceTest {
    @Mock EduAccessService access;
    @Mock EduWebsiteOfferingMapper offerings;
    @Mock EduCourseMapper courses;
    @InjectMocks EduWebsiteOfferingService service;

    @AfterEach void clearTenant() { TenantContextHolder.clear(); }

    @Test void publishingAnOfferingLinkedToDraftCourseIsRejectedBeforeWriting() {
        TenantContextHolder.setTenantId(1L);
        var row = new EduWebsiteOfferingDO(); row.setId(1L); row.setCourseId(8L);
        var course = new EduCourseDO(); course.setTenantId(1L); course.setStatus("DRAFT");
        when(offerings.selectById(1L)).thenReturn(row);
        when(courses.selectById(8L)).thenReturn(course);
        ServiceException error = assertThrows(ServiceException.class,
            () -> service.publish(new EduWebsiteOfferingPublishReqVO(1L, 1, true)));
        assertTrue(error.getMessage().contains("发布关联的业务课程"));
        org.mockito.Mockito.verify(offerings, org.mockito.Mockito.never()).updatePublished(any(), any(), any(), any(), any());
    }

    @Test void publishedOfferingCannotBeRelinkedToDraftCourse() {
        TenantContextHolder.setTenantId(1L);
        var row = new EduWebsiteOfferingDO(); row.setId(1L); row.setSlug("creative"); row.setPublished(true);
        var course = new EduCourseDO(); course.setTenantId(1L); course.setStatus("DRAFT");
        when(offerings.selectById(1L)).thenReturn(row);
        when(courses.selectById(8L)).thenReturn(course);
        ServiceException error = assertThrows(ServiceException.class,
            () -> service.update(new EduWebsiteOfferingUpdateReqVO(1L,"creative",1,"课程","简介","大纲",1,"minecraft",0,8L)));
        assertTrue(error.getMessage().contains("发布关联的业务课程"));
        org.mockito.Mockito.verify(offerings, org.mockito.Mockito.never()).updateContent(any(), any(), any());
    }

    @Test void publishedCourseAndUnlinkedOfferingCanPublish() {
        TenantContextHolder.setTenantId(1L);
        var row = new EduWebsiteOfferingDO(); row.setId(1L); row.setCourseId(8L);
        var course = new EduCourseDO(); course.setTenantId(1L); course.setStatus("PUBLISHED");
        when(offerings.selectById(1L)).thenReturn(row);
        when(courses.selectById(8L)).thenReturn(course);
        when(offerings.updatePublished(any(), any(), any(), any(), any())).thenReturn(1);
        assertDoesNotThrow(() -> service.publish(new EduWebsiteOfferingPublishReqVO(1L, 1, true)));
        row.setCourseId(null);
        assertDoesNotThrow(() -> service.publish(new EduWebsiteOfferingPublishReqVO(1L, 2, true)));
    }

    @Test void unpublishingDoesNotRequireALiveLinkedCourse() {
        TenantContextHolder.setTenantId(1L);
        var row = new EduWebsiteOfferingDO(); row.setId(1L); row.setCourseId(8L);
        when(offerings.selectById(1L)).thenReturn(row);
        when(offerings.updatePublished(any(), any(), any(), any(), any())).thenReturn(1);
        assertDoesNotThrow(() -> service.publish(new EduWebsiteOfferingPublishReqVO(1L, 1, false)));
        org.mockito.Mockito.verifyNoInteractions(courses);
    }

    @Test void draftOfferingCanStillBeEditedWithADraftCourse() {
        TenantContextHolder.setTenantId(1L);
        var row = new EduWebsiteOfferingDO(); row.setId(1L); row.setSlug("creative"); row.setPublished(false);
        var course = new EduCourseDO(); course.setTenantId(1L); course.setStatus("DRAFT");
        when(offerings.selectById(1L)).thenReturn(row);
        when(courses.selectById(8L)).thenReturn(course);
        when(offerings.updateContent(any(), any(), any())).thenReturn(1);
        assertDoesNotThrow(() -> service.update(new EduWebsiteOfferingUpdateReqVO(
            1L, "creative", 1, "课程", "简介", "大纲", 1, "minecraft", 0, 8L)));
    }

    @Test void responseIsTheDocumentedSafeContract() {
        EduWebsiteOfferingDO row=new EduWebsiteOfferingDO();
        row.setId(1L);row.setSlug("creative-world");row.setTitle("创意世界");row.setDescription("简介");
        row.setOutline("大纲");row.setStage(1);row.setImage("minecraft");row.setSortOrder(2);
        row.setPublished(true);row.setCourseId(8L);row.setRevision(3);row.setTenantId(99L);row.setCreator("secret");
        var response=EduWebsiteOfferingService.response(row);
        assertEquals("creative-world",response.slug());assertEquals(3,response.revision());assertEquals(8L,response.courseId());
        assertEquals(11,response.getClass().getRecordComponents().length);
        assertTrue(java.util.Arrays.stream(response.getClass().getRecordComponents()).noneMatch(c->c.getName().equals("tenantId")||c.getName().equals("creator")));
    }

    @Test void omittedOptionalOutlineIsStoredAsEmptyText() {
        EduWebsiteOfferingDO[] inserted=new EduWebsiteOfferingDO[1];
        doAnswer(invocation->{
            inserted[0]=invocation.getArgument(0);
            inserted[0].setId(1L);
            return 1;
        }).when(offerings).insert(any(EduWebsiteOfferingDO.class));
        when(offerings.selectById(1L)).thenAnswer(invocation->inserted[0]);

        var response=service.create(new EduWebsiteOfferingCreateReqVO(
                "creative-world","创意世界","简介",null,1,"minecraft",0,null));

        assertNotNull(inserted[0]);
        assertEquals("",inserted[0].getOutline());
        assertEquals("",response.outline());
    }
}
