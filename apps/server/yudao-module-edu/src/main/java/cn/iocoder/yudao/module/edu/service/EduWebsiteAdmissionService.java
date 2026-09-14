package cn.iocoder.yudao.module.edu.service;

import cn.hutool.crypto.digest.DigestUtil;
import cn.iocoder.yudao.framework.common.exception.ServiceException;
import static cn.iocoder.yudao.module.edu.service.EduWebsiteAdmissionErrorCodes.*;
import cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder;
import cn.iocoder.yudao.module.crm.controller.admin.clue.vo.CrmClueSaveReqVO;
import cn.iocoder.yudao.module.crm.dal.dataobject.clue.CrmClueDO;
import cn.iocoder.yudao.module.crm.dal.mysql.clue.CrmClueMapper;
import cn.iocoder.yudao.module.crm.service.clue.CrmClueService;
import cn.iocoder.yudao.module.edu.controller.app.vo.EduWebsiteAdmissionCreateReqVO;
import cn.iocoder.yudao.module.edu.dal.dataobject.EduWebsiteAdmissionReceiptDO;
import cn.iocoder.yudao.module.edu.dal.mysql.*;
import cn.iocoder.yudao.module.infra.api.config.ConfigApi;
import cn.iocoder.yudao.module.system.dal.mysql.user.AdminUserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.LocalDateTime;
import java.util.*;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;

@Service
@Slf4j
public class EduWebsiteAdmissionService {
    public static final String CHANNEL = "WEBSITE";
    @Resource private EduWebsiteAdmissionReceiptMapper receipts;
    @Resource private CrmClueService clues;
    @Resource private CrmClueMapper clueMapper;
    @Resource private EduCourseMapper courses;
    @Resource private ConfigApi config;
    @Resource private AdminUserMapper users;
    @Resource private EduWebsiteAdmissionTraffic traffic;
    @Resource private PlatformTransactionManager transactionManager;
    @Value("${edu.website-admission.tenant-id:1}") private Long expectedTenant;
    @Value("${edu.website-admission.consent-version:website-contact-2026-09}") private String consentVersion;
    private static final String CONSENT_TEXT = "我同意机构使用本次提交的联系信息和学习意向，联系我并跟进课程咨询。";

    public Map<String,Object> options(HttpServletRequest request) {
        Long tenant = tenant();
        traffic.check("options", tenant, request);
        return Map.of("enabled", ownerId(tenant) != null, "consentVersion", consentVersion, "consentText", CONSENT_TEXT);
    }

    public Map<String,Object> create(EduWebsiteAdmissionCreateReqVO input, HttpServletRequest request) {
        Long tenant = tenant();
        EduWebsiteAdmissionCreateReqVO body = canonical(input);
        traffic.check("create", tenant, request);
        String digest = digest(body);
        String currentTrace = cn.iocoder.yudao.framework.common.util.monitor.TracerUtils.getTraceId();
        String traceId = currentTrace == null || currentTrace.isBlank() ? UUID.randomUUID().toString() : currentTrace;
        EduWebsiteAdmissionReceiptDO prior = lookup(body.getRequestId());
        if (prior != null) return replay(prior, digest);
        // Fresh transactions ensure a failed unique insert cannot poison winner lookup or leave a clue/owner orphan.
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        try {
            Map<String,Object> accepted = tx.execute(status -> {
                EduWebsiteAdmissionReceiptDO existing = lookup(body.getRequestId());
                if (existing != null) return replay(existing, digest);
                if (!Boolean.TRUE.equals(body.getContactConsent()) || !consentVersion.equals(body.getConsentVersion())) {
                    throw new ServiceException(CONSENT_REQUIRED, "请阅读并同意本次咨询联系授权");
                }
                Long owner = ownerId(tenant);
                if (owner == null) throw new ServiceException(INTAKE_UNAVAILABLE, "咨询受理暂不可用");
                if (body.getCourseId() != null) {
                    var course = found(courses.selectById(body.getCourseId()), "课程不存在");
                    require(Objects.equals(course.getTenantId(), tenant) && "PUBLISHED".equals(course.getStatus()), "课程尚未发布");
                }
                var crm = new CrmClueSaveReqVO().setName(body.getContactName()).setOwnerUserId(owner).setSource(90)
                        .setMobile("MOBILE".equals(body.getContactType()) ? body.getContact() : null)
                        .setEmail("EMAIL".equals(body.getContactType()) ? body.getContact() : null)
                        .setRemark("编程经验：" + body.getExperience() + "；学习兴趣：" + body.getInterest());
                Long clueId = clues.createWebsiteClue(crm);
                clueMapper.update(null, new LambdaUpdateWrapper<CrmClueDO>().eq(CrmClueDO::getId, clueId)
                        .set(CrmClueDO::getEducationOrigin, CHANNEL).set(CrmClueDO::getEducationWebsiteStatus, "NEW")
                        .set(CrmClueDO::getEducationServiceType, "COURSE").set(CrmClueDO::getEducationCourseId, body.getCourseId())
                        .set(CrmClueDO::getEducationConsentTime, LocalDateTime.now()).set(CrmClueDO::getEducationConsentVersion, consentVersion)
                        .set(CrmClueDO::getEducationExperience, body.getExperience()).set(CrmClueDO::getEducationInterest, body.getInterest())
                        .set(CrmClueDO::getEducationMessage, body.getMessage()));
                var receipt = new EduWebsiteAdmissionReceiptDO().setChannel(CHANNEL).setRequestId(body.getRequestId())
                        .setPayloadDigest(digest).setCrmClueId(clueId).setReceipt(UUID.randomUUID().toString()).setTraceId(traceId);
                receipt.setTenantId(tenant);
                receipts.insert(receipt);
                return replay(receipt, digest);
            });
            log.info("website_admission_accepted tenant={} receipt={} trace={}", tenant, accepted.get("receipt"),
                    traceId);
            return accepted;
        } catch (DuplicateKeyException collision) {
            // REQUIRES_NEW has rolled back before reading the committed winner.
            EduWebsiteAdmissionReceiptDO winner = tx.execute(status -> lookup(body.getRequestId()));
            if (winner == null) throw collision;
            return replay(winner, digest);
        }
    }

    public cn.iocoder.yudao.framework.common.pojo.PageResult<Map<String,Object>> page(cn.iocoder.yudao.framework.common.pojo.PageParam page) {
        var query = new cn.iocoder.yudao.module.crm.controller.admin.clue.vo.CrmCluePageReqVO();
        query.setPageNo(page.getPageNo()); query.setPageSize(page.getPageSize()); query.setEducationOrigin(CHANNEL);
        var result = clues.getCluePage(query, cn.iocoder.yudao.framework.security.core.util.SecurityFrameworkUtils.getLoginUserId());
        return new cn.iocoder.yudao.framework.common.pojo.PageResult<>(result.getList().stream().map(EduWebsiteAdmissionService::staffView).toList(), result.getTotal());
    }

    public Map<String,Object> get(Long id) {
        var clue = found(clues.getClue(id), "咨询不存在"); // Original CRM READ aspect.
        require(CHANNEL.equals(clue.getEducationOrigin()), "此线索不是网站咨询");
        return staffView(clue);
    }

    public void update(Long id, String status, String note) {
        clues.updateWebsiteAdmission(id, status, note); // Original CRM WRITE aspect and employee operation log.
    }

    private static Map<String,Object> staffView(CrmClueDO clue) {
        Map<String,Object> result = new LinkedHashMap<>();
        result.put("id", clue.getId()); result.put("contactName", clue.getName());
        result.put("mobile", clue.getMobile()); result.put("email", clue.getEmail());
        result.put("contact", clue.getMobile() == null || clue.getMobile().isBlank() ? clue.getEmail() : clue.getMobile());
        result.put("experience", clue.getEducationExperience()); result.put("interest", clue.getEducationInterest());
        result.put("message", clue.getEducationMessage()); result.put("status", clue.getEducationWebsiteStatus());
        result.put("note", clue.getEducationOperatorNote()); result.put("courseId", clue.getEducationCourseId());
        result.put("createTime", clue.getCreateTime()); result.put("ownerUserId", clue.getOwnerUserId());
        result.put("consentVersion", clue.getEducationConsentVersion()); result.put("consentTime", clue.getEducationConsentTime());
        return result;
    }

    private Long tenant() {
        Long tenant = TenantContextHolder.getTenantId();
        require(expectedTenant != null && expectedTenant > 0 && Objects.equals(expectedTenant, tenant)
                && !TenantContextHolder.isIgnore(), "网站租户无效");
        return tenant;
    }

    private Long ownerId(Long tenant) {
        String value = config.getConfigValueByKey(EduAdmissionService.OWNER_CONFIG_KEY);
        if (value == null || !value.matches("[1-9][0-9]{0,18}")) return null;
        try {
            var user = users.selectById(Long.valueOf(value));
            return user != null && Objects.equals(user.getStatus(), 0) && Objects.equals(user.getTenantId(), tenant) ? user.getId() : null;
        } catch (NumberFormatException invalid) { return null; }
    }

    private EduWebsiteAdmissionReceiptDO lookup(String requestId) {
        return receipts.selectOne(new LambdaQueryWrapper<EduWebsiteAdmissionReceiptDO>()
                .eq(EduWebsiteAdmissionReceiptDO::getChannel, CHANNEL).eq(EduWebsiteAdmissionReceiptDO::getRequestId, requestId));
    }

    static Map<String,Object> replay(EduWebsiteAdmissionReceiptDO receipt, String digest) {
        if (!Objects.equals(receipt.getPayloadDigest(), digest))
            throw new ServiceException(REQUEST_CONFLICT, "请求编号已用于其他内容，请重新提交");
        return Map.of("receipt", receipt.getReceipt(), "status", "ACCEPTED");
    }

    static EduWebsiteAdmissionCreateReqVO canonical(EduWebsiteAdmissionCreateReqVO input) {
        require(input != null, "提交内容不能为空");
        var b = new EduWebsiteAdmissionCreateReqVO();
        // Request identifiers are case-sensitive ASCII and are never silently trimmed.
        require(input.getRequestId() != null && input.getRequestId().matches("[A-Za-z0-9_-]{16,80}"), "请求编号无效");
        b.setRequestId(input.getRequestId());
        b.setContactName(field(input.getContactName(), 80, true));
        require("MOBILE".equals(input.getContactType()) || "EMAIL".equals(input.getContactType()), "联系方式类型无效");
        b.setContactType(input.getContactType());
        b.setContact(field(input.getContact(), 254, true));
        if ("MOBILE".equals(b.getContactType())) require(b.getContact().matches("1[3-9][0-9]{9}"), "手机号格式无效");
        else require(b.getContact().matches("[^\\s@]+@[^\\s@.]+(?:\\.[^\\s@.]+)+"), "邮箱格式无效");
        b.setExperience(field(input.getExperience(), 200, false));
        b.setInterest(field(input.getInterest(), 200, false));
        b.setMessage(field(input.getMessage(), 2000, false));
        require(input.getCourseId() == null || input.getCourseId() > 0, "课程编号无效");
        b.setCourseId(input.getCourseId());
        require(input.getContactConsent() != null, "联系授权不能为空");
        b.setContactConsent(input.getContactConsent());
        b.setConsentVersion(field(input.getConsentVersion(), 80, true));
        return b;
    }

    private static String field(String value, int maximum, boolean required) {
        String normalized = value == null ? "" : value.trim();
        require(normalized.length() <= maximum && (!required || !normalized.isBlank())
                && normalized.indexOf('\0') < 0, "提交字段为空或超出长度限制");
        return normalized;
    }

    static String digest(EduWebsiteAdmissionCreateReqVO b) {
        try {
            // Fixed order, explicit nulls, UTF-8 hashing; requestId is the key, not part of the payload.
            return DigestUtil.sha256Hex(new ObjectMapper().writeValueAsString(Arrays.asList(b.getContactName(), b.getContactType(),
                    b.getContact(), b.getExperience(), b.getInterest(), b.getMessage(), b.getCourseId(), b.getContactConsent(), b.getConsentVersion())));
        } catch (JsonProcessingException impossible) { throw new IllegalStateException(impossible); }
    }
}
