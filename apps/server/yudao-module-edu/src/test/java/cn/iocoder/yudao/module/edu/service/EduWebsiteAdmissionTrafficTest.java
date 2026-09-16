package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class EduWebsiteAdmissionTrafficTest {
    @Test void exhaustedWindowHasStableCodeAndThresholdStillAccepts() {
        var limiter = new EduWebsiteAdmissionTraffic();
        var redis = org.mockito.Mockito.mock(org.springframework.data.redis.core.StringRedisTemplate.class);
        org.springframework.test.util.ReflectionTestUtils.setField(limiter, "redis", redis);
        org.springframework.test.util.ReflectionTestUtils.setField(limiter, "windowSeconds", 60);
        org.springframework.test.util.ReflectionTestUtils.setField(limiter, "createLimit", 10);
        org.springframework.test.util.ReflectionTestUtils.setField(limiter, "optionsLimit", 60);
        org.springframework.test.util.ReflectionTestUtils.setField(limiter, "trustedProxies", "127.0.0.1");
        var request = new org.springframework.mock.web.MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.7");
        org.mockito.Mockito.when(redis.execute(org.mockito.ArgumentMatchers.<org.springframework.data.redis.core.script.RedisScript<Long>>any(),
                org.mockito.ArgumentMatchers.<String>anyList(), org.mockito.ArgumentMatchers.eq("60"))).thenReturn(10L, 11L, 61L);
        assertDoesNotThrow(() -> limiter.check("create", 1L, request));
        assertEquals(EduWebsiteAdmissionErrorCodes.RATE_LIMITED,
                assertThrows(ServiceException.class, () -> limiter.check("create", 1L, request)).getCode());
        assertEquals(EduWebsiteAdmissionErrorCodes.RATE_LIMITED,
                assertThrows(ServiceException.class, () -> limiter.check("options", 1L, request)).getCode());
    }

    @Test void untrustedCallerCannotSpoofClientHeader() {
        assertEquals("203.0.113.4", EduWebsiteAdmissionTraffic.clientIp("203.0.113.4", "198.51.100.2", "127.0.0.1,::1"));
        assertEquals("203.0.113.4", EduWebsiteAdmissionTraffic.clientIp("203.0.113.4", "malformed", "127.0.0.1"));
    }
    @Test void trustedProxyAcceptsOnlySingleNumericAddress() {
        assertEquals("198.51.100.2", EduWebsiteAdmissionTraffic.clientIp("127.0.0.1", "198.51.100.2", "127.0.0.1"));
        assertEquals("2001:db8::1", EduWebsiteAdmissionTraffic.clientIp("::1", "2001:db8::1", "::1"));
        for (String bad : new String[]{"1.2.3.4, 5.6.7.8", "localhost", "999.1.2.3", "1:2", " 1.2.3.4", ""})
            assertThrows(ServiceException.class, () -> EduWebsiteAdmissionTraffic.clientIp("127.0.0.1", bad, "127.0.0.1"));
    }
}
