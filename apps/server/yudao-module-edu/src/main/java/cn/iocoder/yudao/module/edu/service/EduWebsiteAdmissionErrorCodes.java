package cn.iocoder.yudao.module.edu.service;

/** Stable public intake error contract; syntax validation continues to use the general EDU code. */
public final class EduWebsiteAdmissionErrorCodes {
    private EduWebsiteAdmissionErrorCodes() {}
    /** Consent was declined or the submitted version is no longer current. Refresh options and reconfirm. */
    public static final int CONSENT_REQUIRED = 1_090_010_001;
    /** An accepted request key belongs to a different canonical payload. */
    public static final int REQUEST_CONFLICT = 1_090_010_002;
    /** A valid active owner is not configured in this tenant. */
    public static final int INTAKE_UNAVAILABLE = 1_090_010_003;
    /** The public endpoint's IP/tenant traffic window is exhausted. */
    public static final int RATE_LIMITED = 1_090_010_004;
}
