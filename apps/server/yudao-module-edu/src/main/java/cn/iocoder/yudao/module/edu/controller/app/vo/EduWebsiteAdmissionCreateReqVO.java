package cn.iocoder.yudao.module.edu.controller.app.vo;

import lombok.Data;

/** Only visitor-supplied intake facts; no owner, identity or CRM status fields. */
@Data
public class EduWebsiteAdmissionCreateReqVO {
    private String requestId;
    private String contactName;
    private String contactType;
    private String contact;
    private String experience;
    private String interest;
    private String message;
    private Long courseId;
    private Boolean contactConsent;
    private String consentVersion;
}
