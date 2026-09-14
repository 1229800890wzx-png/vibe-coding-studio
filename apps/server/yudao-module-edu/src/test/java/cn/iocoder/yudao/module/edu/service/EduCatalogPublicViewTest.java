package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import cn.iocoder.yudao.module.edu.dal.dataobject.EduCourseDO;
import cn.iocoder.yudao.module.edu.dal.mysql.EduCourseMapper;
import cn.iocoder.yudao.module.edu.dal.mysql.EduCourseVersionMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EduCatalogPublicViewTest {
    @Mock EduCourseMapper courses;
    @Mock EduCourseVersionMapper versions;
    @InjectMocks EduCatalogService service;

    @Test void publicSnapshotUsesAStableWhitelistIncludingExerciseSummary() {
        EduCourseDO course=new EduCourseDO().setId(8L).setSpuId(9L).setVersion(3).setRevision(7);
        Map<String,Object> snapshot=Map.ofEntries(
            Map.entry("name","创意课"),Map.entry("code","creative"),Map.entry("description","简介"),
            Map.entry("coverUrl","https://example.test/cover.png"),Map.entry("ageMin",8),Map.entry("ageMax",12),
            Map.entry("direction","GAME"),Map.entry("level","STARTER"),Map.entry("objectives","目标"),
            Map.entry("outcomes","作品"),Map.entry("tenantId",99),Map.entry("creator","secret"),
            Map.entry("lessonsJson","[{\"title\":\"第一课\",\"durationMinutes\":90,\"objectives\":\"会做\",\"assignment\":\"画草图\",\"joinInfo\":\"secret\",\"submission\":{\"child\":1}}]"));

        Map<String,Object> result=EduCatalogService.publicCourseSnapshot(course,snapshot);

        assertEquals(List.of("id","spuId","name","code","description","coverUrl","ageMin","ageMax",
            "direction","level","objectives","outcomes","status","version","revision","lessons"),List.copyOf(result.keySet()));
        assertFalse(result.containsKey("tenantId"));assertFalse(result.containsKey("creator"));
        Map<?,?> lesson=(Map<?,?>)((List<?>)result.get("lessons")).get(0);
        assertEquals(List.of("title","durationMinutes","objectives","assignment"),List.copyOf(lesson.keySet()));
        assertEquals("画草图",lesson.get("assignment"));assertFalse(lesson.containsKey("joinInfo"));assertFalse(lesson.containsKey("submission"));
    }

    @Test void publishedCourseWithoutItsSnapshotFailsClosed() {
        EduCourseDO course=new EduCourseDO().setId(8L).setStatus("PUBLISHED").setVersion(3);
        when(courses.selectById(8L)).thenReturn(course);
        assertThrows(ServiceException.class,()->service.course(8L,false));
    }

    @Test void draftStillUsesTheExistingPublicRejection() {
        EduCourseDO course=new EduCourseDO().setId(8L).setStatus("DRAFT").setVersion(0);
        when(courses.selectById(8L)).thenReturn(course);
        ServiceException error=assertThrows(ServiceException.class,()->service.course(8L,false));
        assertEquals("课程尚未发布",error.getMessage());
    }
}
