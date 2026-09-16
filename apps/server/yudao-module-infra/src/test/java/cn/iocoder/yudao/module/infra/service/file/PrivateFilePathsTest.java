package cn.iocoder.yudao.module.infra.service.file;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class PrivateFilePathsTest {
    @Test void reservedPathsCannotUsePublicDownloadOrUpload(){
        for(String path:new String[]{"edu-private/1/23/file.pdf","/2026/EDU-PRIVATE/file.pdf","https://bucket.test/edu-private/secret","edu-private\\1\\secret"})assertThrows(RuntimeException.class,()->PrivateFilePaths.requirePublic(path));
        assertDoesNotThrow(()->PrivateFilePaths.requirePublic("course-cover/2026/sample.webp"));
        assertDoesNotThrow(()->PrivateFilePaths.requirePublic(null));
    }
}
