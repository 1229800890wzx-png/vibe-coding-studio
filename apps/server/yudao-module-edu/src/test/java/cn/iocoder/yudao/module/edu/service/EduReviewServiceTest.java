package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import com.baomidou.mybatisplus.core.toolkit.support.SFunction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EduReviewServiceTest {
    private final EduLearningService service=new EduLearningService();
    private final EduAccessService access=mock(EduAccessService.class);
    private final EduSubmissionMapper submissions=mock(EduSubmissionMapper.class);
    private final EduAssignmentMapper assignments=mock(EduAssignmentMapper.class);
    private final EduStudentMapper students=mock(EduStudentMapper.class);
    private final EduReviewMapper reviews=mock(EduReviewMapper.class);
    private final EduNotifyService notices=mock(EduNotifyService.class);
    @BeforeEach void setup() {
        ReflectionTestUtils.setField(service,"access",access);ReflectionTestUtils.setField(service,"submissions",submissions);
        ReflectionTestUtils.setField(service,"assignments",assignments);ReflectionTestUtils.setField(service,"students",students);
        ReflectionTestUtils.setField(service,"reviews",reviews);ReflectionTestUtils.setField(service,"notices",notices);
        var submission=new EduSubmissionDO().setId(1L).setAssignmentId(2L).setStudentId(3L).setStatus("SUBMITTED");
        when(submissions.selectById(1L)).thenReturn(submission);
        when(submissions.selectOneForUpdate(any(),eq(1L))).thenReturn(submission);
        when(assignments.selectById(2L)).thenReturn(new EduAssignmentDO().setId(2L).setCohortId(4L));
        when(access.actor()).thenReturn(5L);
    }
    private Map<String,Object> request(int revision) {return new HashMap<>(Map.of("id",1L,"revision",revision,"status","DRAFT","feedback","Explain one test case","score",80,"requireRevision",true));}
    @Test void staleDraftCannotOverwriteAnotherTeachersCurrentRevision() {
        var current=new EduReviewDO().setId(10L).setSubmissionId(1L).setStatus("DRAFT").setRevision(2).setFeedback("Saved by another teacher");
        when(reviews.selectOneForUpdate(any(),eq(1L))).thenReturn(current);
        assertThrows(ServiceException.class,()->service.review(request(1)));
        assertEquals("Saved by another teacher",current.getFeedback());
        verify(reviews,never()).updateById(any(EduReviewDO.class));verify(reviews,never()).insert(any(EduReviewDO.class));verifyNoInteractions(notices);
    }
    @Test void firstDraftRequiresRevisionAndReturnsPersistedSaveMetadata() {
        var persisted=new EduReviewDO().setId(10L).setSubmissionId(1L).setStatus("DRAFT").setRevision(1).setRequireRevision(true);
        persisted.setUpdateTime(LocalDateTime.of(2026,9,14,8,30));
        when(reviews.insert(any(EduReviewDO.class))).thenAnswer(invocation->{EduReviewDO row=invocation.getArgument(0);assertEquals(1,row.getRevision());row.setId(10L);return 1;});
        when(reviews.selectOneForUpdate(any(),eq(10L))).thenReturn(persisted);
        var saved=service.review(request(0));assertEquals(1,saved.get("revision"));assertEquals(true,saved.get("requireRevision"));
        assertEquals(EduViews.map(persisted).get("updateTime"),saved.get("updateTime"));verifyNoInteractions(notices);
    }
    @Test void missingRevisionDoesNotProvideACompatibilityOverwriteBypass() {
        var body=request(0);body.remove("revision");assertThrows(ServiceException.class,()->service.review(body));
        verify(reviews,never()).insert(any(EduReviewDO.class));verify(reviews,never()).updateById(any(EduReviewDO.class));
    }
    @Test void publishedReviewCannotBeChangedEvenWithItsCurrentRevision() {
        var current=new EduReviewDO().setId(10L).setSubmissionId(1L).setStatus("PUBLISHED").setRevision(2).setFeedback("Immutable published feedback");
        when(reviews.selectOneForUpdate(any(),eq(1L))).thenReturn(current);
        assertThrows(ServiceException.class,()->service.review(request(2)));assertEquals("Immutable published feedback",current.getFeedback());
        verify(reviews,never()).updateById(any(EduReviewDO.class));verifyNoInteractions(notices);
    }
}
