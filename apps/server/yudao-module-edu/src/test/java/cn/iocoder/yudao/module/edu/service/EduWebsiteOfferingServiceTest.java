package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.controller.vo.EduWebsiteOfferingCreateReqVO;
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
