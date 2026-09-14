package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.infra.dal.dataobject.file.FileDO;
import cn.iocoder.yudao.module.infra.service.file.FileService;
import cn.iocoder.yudao.framework.common.util.json.JsonUtils;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;
import static cn.iocoder.yudao.module.edu.service.EduViews.*;

@Service
public class EduWorkService {
    @Resource private EduAccessService access;
    @Resource private EduLearningService learning;
    @Resource private EduWorkMapper works;
    @Resource private EduWorkVersionMapper versions;
    @Resource private EduPublishConsentMapper consents;
    @Resource private EduPublicationMapper publications;
    @Resource private EduSubmissionMapper submissions;
    @Resource private EduAssignmentMapper assignments;
    @Resource private EduFileService educationFiles;
    @Resource private EduFileAccessMapper fileAccess;
    @Resource private FileService originalFiles;
    public Map<String,Object> view(EduWorkDO w,boolean admin) {
        Map<String,Object> v=map(w);EduPublishConsentDO c=consents.selectOne(EduPublishConsentDO::getWorkId,w.getId(),EduPublishConsentDO::getVersion,w.getVersion());v.put("consentStatus",c==null?"NOT_GRANTED":c.getStatus());
        EduPublicationDO p=publications.selectOne(EduPublicationDO::getWorkId,w.getId(),EduPublicationDO::getVersion,w.getVersion());v.put("moderationStatus",p==null?"PENDING":p.getStatus());v.put("moderationNote",p==null?"":p.getModerationNote());
        if(admin){Map<String,Object> submission=learning.adminSubmission(w.getSubmissionId());Map<String,Object> snapshot=snapshot(w);submission.put("content",snapshot.getOrDefault("content",""));submission.put("attachments",objects(json(snapshot.get("attachments"))));v.put("submission",submission);}return v;
    }
    public List<Map<String,Object>> ownList(Long studentId){access.ownStudent(studentId);return works.selectList(new LambdaQueryWrapper<EduWorkDO>().eq(EduWorkDO::getStudentId,studentId).orderByDesc(EduWorkDO::getId)).stream().map(w->view(w,false)).toList();}
    @Transactional(rollbackFor=Exception.class)
    public Long create(Map<String,Object> b) {
        Long studentId=id(b,"studentId");access.ownStudent(studentId);EduSubmissionDO s=found(submissions.selectById(id(b,"submissionId")),"请选择已提交的作业版本");
        require(Objects.equals(studentId,s.getStudentId())&&!"DRAFT".equals(s.getStatus()),"作品来源必须是当前孩子已提交的作业");
        EduWorkDO w=new EduWorkDO().setStudentId(studentId).setSubmissionId(s.getId()).setTitle(requiredText(b,"title",120)).setDescription(text(b,"description")).setVersion(1).setStatus("PRIVATE").setCoverUrl("");works.insert(w);
        List<Map<String,Object>> attachments=educationFiles.validateAttachments(objects(s.getAttachmentsJson()),studentId);
        List<Map<String,Object>> pinnedFiles=new ArrayList<>();for(Map<String,Object> attachment:attachments){var pinned=new LinkedHashMap<>(attachment);EduFileAccessDO grant=found(fileAccess.selectOne(EduFileAccessDO::getFileId,id(attachment,"fileId")),"附件登记不存在");pinned.put("sha256",grant.getSha256());pinnedFiles.add(pinned);}
        versions.insert(new EduWorkVersionDO().setWorkId(w.getId()).setVersion(1).setSubmissionId(s.getId()).setContentJson(json(Map.of("title",w.getTitle(),"description",w.getDescription(),"coverUrl",w.getCoverUrl(),"content",Objects.requireNonNullElse(s.getContent(),""),"attachments",pinnedFiles))));return w.getId();
    }
    @Transactional(rollbackFor=Exception.class)
    public void consent(Long id,Integer version,boolean grant) {
        EduWorkDO w=found(works.selectOneForUpdate(EduWorkDO::getId,id),"作品不存在");access.ownStudent(w.getStudentId());
        if(grant)require(Objects.equals(w.getVersion(),version),"作品版本已变化，请重新预览并授权");
        EduPublishConsentDO c=consents.selectOne(EduPublishConsentDO::getWorkId,id,EduPublishConsentDO::getVersion,w.getVersion());boolean fresh=c==null;
        if(fresh)c=new EduPublishConsentDO().setWorkId(id).setVersion(w.getVersion()).setGuardianMemberId(access.actor());
        c.setStatus(grant?"GRANTED":"REVOKED");if(grant){c.setGrantedAt(LocalDateTime.now());c.setRevokedAt(null);}else c.setRevokedAt(LocalDateTime.now());
        if(fresh)consents.insert(c);else consents.updateById(c);
        w.setStatus(grant?"PENDING":"PRIVATE");works.updateById(w);
        if(!grant){EduPublicationDO p=publications.selectOne(EduPublicationDO::getWorkId,id,EduPublicationDO::getVersion,w.getVersion());if(p!=null){p.setStatus("REVOKED");publications.updateById(p);}}
    }
    public EduWorkDO adminWork(Long id){access.permission("work","query");EduWorkDO w=found(works.selectById(id),"作品不存在");EduSubmissionDO s=found(submissions.selectById(w.getSubmissionId()),"作品来源不存在");access.adminCohort(found(assignments.selectById(s.getAssignmentId()),"课程作业不存在").getCohortId());return w;}
    @Transactional(rollbackFor=Exception.class)
    public void moderate(Map<String,Object> b,boolean publish) {
        access.permission("work",publish?"publish":"moderate");Long id=id(b,"id");adminWork(id);EduWorkDO w=found(works.selectOneForUpdate(EduWorkDO::getId,id),"作品不存在");
        EduPublishConsentDO consent=consents.selectOne(EduPublishConsentDO::getWorkId,id,EduPublishConsentDO::getVersion,w.getVersion());require(consent!=null&&"GRANTED".equals(consent.getStatus()),"当前作品版本尚未获得家长授权");
        EduPublicationDO p=publications.selectOne(EduPublicationDO::getWorkId,id,EduPublicationDO::getVersion,w.getVersion());boolean fresh=p==null;
        if(fresh)p=new EduPublicationDO().setWorkId(id).setVersion(w.getVersion()).setStatus("PENDING");
        if(publish){require("APPROVED".equals(p.getStatus()),"请先审核通过当前作品版本");p.setStatus("PUBLISHED");p.setPublishedAt(LocalDateTime.now());w.setStatus("PUBLISHED");}
        else{String state=text(b,"status");require(Set.of("APPROVED","REJECTED").contains(state),"审核状态无效");p.setStatus(state);p.setModerationNote(text(b,"note"));w.setStatus("REJECTED".equals(state)?"REJECTED":"PENDING");}
        p.setModeratorId(access.actor());if(fresh)publications.insert(p);else publications.updateById(p);works.updateById(w);
    }
    private EduWorkDO publishedWork(Long id,Integer version) {
        EduWorkDO w=found(works.selectById(id),"作品尚未公开或已撤回");EduPublicationDO p=publications.selectOne(EduPublicationDO::getWorkId,id,EduPublicationDO::getVersion,w.getVersion());EduPublishConsentDO c=consents.selectOne(EduPublishConsentDO::getWorkId,id,EduPublishConsentDO::getVersion,w.getVersion());
        require(version==null||Objects.equals(version,w.getVersion()),"作品版本已变化，请重新打开作品");
        require("PUBLISHED".equals(w.getStatus())&&p!=null&&"PUBLISHED".equals(p.getStatus())&&c!=null&&"GRANTED".equals(c.getStatus()),"作品尚未公开或已撤回");
        return w;
    }
    private EduWorkDO ownWork(Long id,Integer version){EduWorkDO w=found(works.selectById(id),"作品不存在");access.ownStudent(w.getStudentId());require(version!=null&&Objects.equals(version,w.getVersion()),"作品版本已变化，请重新预览");return w;}
    private Map<String,Object> snapshot(EduWorkDO w){EduWorkVersionDO version=found(versions.selectOne(EduWorkVersionDO::getWorkId,w.getId(),EduWorkVersionDO::getVersion,w.getVersion()),"作品版本不存在");return JsonUtils.parseObject(version.getContentJson(),Map.class);}
    private Map<String,Object> display(EduWorkDO w,boolean detail){
        Map<String,Object> snapshot=snapshot(w),v=new LinkedHashMap<>();v.put("id",w.getId());v.put("version",w.getVersion());v.put("title",snapshot.getOrDefault("title",w.getTitle()));v.put("description",snapshot.getOrDefault("description",w.getDescription()));v.put("coverUrl",snapshot.getOrDefault("coverUrl",w.getCoverUrl()));v.put("status",w.getStatus());
        EduPublicationDO publication=publications.selectOne(EduPublicationDO::getWorkId,w.getId(),EduPublicationDO::getVersion,w.getVersion());if(publication!=null)v.put("publishedAt",publication.getPublishedAt());
        if(detail){v.put("content",snapshot.getOrDefault("content",""));List<Map<String,Object>> attachments=objects(json(snapshot.get("attachments"))),safe=new ArrayList<>();for(int index=0;index<attachments.size();index++){Map<String,Object> attachment=attachments.get(index);validateFile(w,attachment);safe.add(Map.of("index",index,"name",text(attachment,"name")));}v.put("attachments",safe);}
        return v;
    }
    public Map<String,Object> preview(Long id,Integer version){return display(ownWork(id,version),true);}
    public Map<String,Object> publicWork(Long id){return publicWork(id,null);}
    public Map<String,Object> publicWork(Long id,Integer version){return display(publishedWork(id,version),true);}
    private FileDO validateFile(EduWorkDO w,Map<String,Object> attachment){
        Long fileId=id(attachment,"fileId");EduFileAccessDO grant=found(fileAccess.selectOne(EduFileAccessDO::getFileId,fileId),"作品附件当前不可用");
        require("READY".equals(grant.getStatus())&&"SUBMISSION".equals(grant.getPurpose())&&Objects.equals(grant.getStudentId(),w.getStudentId())&&grant.getCohortId()==null,"作品附件当前不可用");
        String pinnedHash=text(attachment,"sha256");require(pinnedHash.isBlank()||Objects.equals(pinnedHash,grant.getSha256()),"作品附件已变化，需要重新提交审核");return found(originalFiles.getFile(fileId),"作品附件当前不可用");
    }
    public record WorkFile(String name,byte[] content) {}
    public WorkFile attachment(Long id,Integer version,Integer index,boolean published)throws Exception {
        // Resolve an ordinal only inside this exact immutable version. Never accept an arbitrary private file ID.
        require(version!=null,"请指定作品版本");EduWorkDO w=published?publishedWork(id,version):ownWork(id,version);List<Map<String,Object>> attachments=objects(json(snapshot(w).get("attachments")));
        require(index!=null&&index>=0&&index<attachments.size(),"作品附件不存在");Map<String,Object> attachment=attachments.get(index);FileDO file=validateFile(w,attachment);byte[] bytes=educationFiles.content(file);
        EduFileAccessDO grant=found(fileAccess.selectOne(EduFileAccessDO::getFileId,file.getId()),"作品附件当前不可用");require(Objects.equals(grant.getSha256(),cn.hutool.crypto.digest.DigestUtil.sha256Hex(bytes)),"作品附件已变化，需要重新提交审核");
        if(published)publishedWork(id,version);else ownWork(id,version);
        return new WorkFile(text(attachment,"name"),bytes);
    }
    public Map<String,Object> publicPage(Map<String,Object> b) {List<Map<String,Object>> rows=new ArrayList<>();for(EduWorkDO w:works.selectList(EduWorkDO::getStatus,"PUBLISHED")){try{rows.add(display(publishedWork(w.getId(),null),false));}catch(cn.iocoder.yudao.framework.common.exception.ServiceException ignored){}}return page(rows,integer(b,"pageNo",1),integer(b,"pageSize",20));}
}
