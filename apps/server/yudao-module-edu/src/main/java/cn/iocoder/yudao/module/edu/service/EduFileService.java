package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.dal.dataobject.*;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.infra.dal.dataobject.file.FileDO;
import cn.iocoder.yudao.module.infra.dal.mysql.file.FileMapper;
import cn.iocoder.yudao.module.infra.service.file.FileService;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;

/** Education ownership only. Bytes, storage configuration and file metadata remain in upstream infra. */
@Service
public class EduFileService {
    @Resource private EduAccessService access;
    @Resource private FileService files;
    @Resource private FileMapper originalFiles;
    @Resource private EduFileAccessMapper grants;
    @Resource private EduSubmissionMapper submissions;
    @Resource private EduEnrollmentMapper enrollments;
    @Resource private EduAssignmentMapper assignments;

    @Transactional(rollbackFor=Exception.class)
    public Map<String,Object> upload(Long studentId, MultipartFile file) throws Exception {
        access.ownStudent(studentId);
        require(file != null && !file.isEmpty() && file.getSize() <= 30L*1024*1024,"请选择不超过30MB的附件");
        String name=Objects.requireNonNullElse(file.getOriginalFilename(),"附件");
        require(name.length()<=160&&!name.contains("/")&&!name.contains("\\"),"附件名称无效");
        String ext=name.contains(".")?name.substring(name.lastIndexOf('.')+1).toLowerCase(Locale.ROOT):"";
        require(Set.of("png","jpg","jpeg","webp","pdf","txt","md","zip","sb3","mp4","mov","mp3","wav","html","js","json","css").contains(ext),"暂不支持这个附件类型");
        byte[] content=file.getBytes();
        String directory="edu-private/"+cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder.getRequiredTenantId()+"/"+studentId+"/"+UUID.randomUUID();
        // Always downloaded as an attachment, including source code. No HTML execution on the API origin.
        String url=files.createFile(content,name,directory,"application/octet-stream");
        FileDO stored=found(originalFiles.selectOne(FileDO::getUrl,url),"文件已上传但登记失败，请重试");
        EduFileAccessDO grant=new EduFileAccessDO().setFileId(stored.getId()).setStudentId(studentId)
            .setOwnerMemberId(access.actor()).setName(name).setPurpose("SUBMISSION")
            .setSha256(cn.hutool.crypto.digest.DigestUtil.sha256Hex(content)).setStatus("READY");
        grants.insert(grant);return Map.of("fileId",stored.getId(),"name",name,"size",file.getSize());
    }
    public FileDO authorized(Long fileId,Long studentId,boolean admin) {
        EduFileAccessDO g=found(grants.selectOne(EduFileAccessDO::getFileId,fileId),"附件不存在或无权访问");
        if(g.getCohortId()!=null){
            if(admin){access.permission("session","query");access.adminCohort(g.getCohortId());}
            else {require(studentId!=null,"请指定查看资料的孩子");access.entitled(studentId,g.getCohortId(),false);}
            require("READY".equals(g.getStatus()),"附件当前不可用");return files.getFile(fileId);
        }
        if(admin) {
            access.permission("submission","query");
            // Staff, including headquarters, can read only files referenced by a submitted version.
            boolean permitted=false;
            for(EduSubmissionDO s:submissions.selectList(EduSubmissionDO::getStudentId,g.getStudentId())) {
                if("DRAFT".equals(s.getStatus()))continue;
                boolean references=EduViews.objects(s.getAttachmentsJson()).stream().anyMatch(a->Objects.equals(id(a,"fileId"),fileId));
                if(references){EduAssignmentDO a=assignments.selectById(s.getAssignmentId());if(a!=null){try{access.adminCohort(a.getCohortId());permitted=true;break;}catch(cn.iocoder.yudao.framework.common.exception.ServiceException ignored){}}}
            }
            require(permitted,"无权查看此附件");
        } else {
            access.ownStudent(g.getStudentId());require(studentId==null||Objects.equals(studentId,g.getStudentId()),"附件不属于当前孩子");
            require(Objects.equals(g.getOwnerMemberId(),access.actor()),"附件不属于当前家长");
        }
        require("READY".equals(g.getStatus()),"附件当前不可用");return files.getFile(fileId);
    }
    public List<Map<String,Object>> validateAttachments(Object input,Long studentId) {
        List<Map<String,Object>> result=new ArrayList<>();List<Map<String,Object>> attachments=EduViews.objects(EduViews.json(input));
        require(attachments.size()<=10,"每次最多提交10个附件");Set<Long> seen=new HashSet<>();
        for(Map<String,Object> item:attachments){Long id=id(item,"fileId");require(id!=null&&seen.add(id),"附件编号为空或重复");authorized(id,studentId,false);EduFileAccessDO g=grants.selectOne(EduFileAccessDO::getFileId,id);result.add(Map.of("fileId",id,"name",g.getName()));}
        return result;
    }
    public byte[] content(FileDO file) throws Exception {return files.getFileContent(file.getConfigId(),file.getPath());}
    @Transactional(rollbackFor=Exception.class)
    public Map<String,Object> uploadMaterial(Long cohortId,MultipartFile file)throws Exception {
        access.anyPermission("edu:session:update","edu:assignment:create","edu:assignment:update");access.adminCohort(cohortId);require(file!=null&&!file.isEmpty()&&file.getSize()<=30L*1024*1024,"资料附件不得超过30MB");
        String name=Objects.requireNonNullElse(file.getOriginalFilename(),"资料");require(name.length()<=160&&!name.contains("/")&&!name.contains("\\"),"文件名无效");
        byte[] bytes=file.getBytes();String directory="edu-private/"+cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder.getRequiredTenantId()+"/cohort/"+cohortId+"/"+UUID.randomUUID();
        String url=files.createFile(bytes,name,directory,"application/octet-stream");FileDO stored=found(originalFiles.selectOne(FileDO::getUrl,url),"资料上传登记失败");
        grants.insert(new EduFileAccessDO().setFileId(stored.getId()).setCohortId(cohortId).setName(name).setPurpose("MATERIAL").setSha256(cn.hutool.crypto.digest.DigestUtil.sha256Hex(bytes)).setStatus("READY"));return Map.of("fileId",stored.getId(),"name",name);
    }
    public List<Map<String,Object>> validateMaterials(Object input,Long cohortId){List<Map<String,Object>> result=new ArrayList<>();for(Map<String,Object> item:EduViews.objects(EduViews.json(input))){Long id=id(item,"fileId");EduFileAccessDO g=found(grants.selectOne(EduFileAccessDO::getFileId,id),"请先上传班期资料");require(Objects.equals(cohortId,g.getCohortId())&&"MATERIAL".equals(g.getPurpose()),"资料不属于当前班期");result.add(Map.of("fileId",id,"name",g.getName()));}return result;}
}
