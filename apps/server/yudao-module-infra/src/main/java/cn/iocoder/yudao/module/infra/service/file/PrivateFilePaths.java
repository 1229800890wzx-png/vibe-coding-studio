package cn.iocoder.yudao.module.infra.service.file;

/** Reserved business-private storage paths must never pass through public file endpoints. */
public final class PrivateFilePaths {
    private PrivateFilePaths() {}
    public static void requirePublic(String path) {
        if (path == null) return;
        String normalized = path.replace('\\', '/').toLowerCase(java.util.Locale.ROOT);
        if (normalized.contains("edu-private")) {
            throw new cn.iocoder.yudao.framework.common.exception.ServiceException(1_090_000_002,
                    "教育附件请通过有权限的作业或资料页面访问");
        }
    }
}
