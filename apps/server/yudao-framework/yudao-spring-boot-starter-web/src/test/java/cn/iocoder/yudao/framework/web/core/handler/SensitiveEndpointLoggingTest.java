package cn.iocoder.yudao.framework.web.core.handler;

import cn.iocoder.yudao.framework.apilog.core.annotation.ApiAccessLog;
import cn.iocoder.yudao.framework.apilog.core.interceptor.ApiAccessLogInterceptor;
import cn.iocoder.yudao.framework.common.biz.infra.logger.ApiErrorLogCommonApi;
import cn.iocoder.yudao.framework.common.biz.infra.logger.dto.ApiErrorLogCreateReqDTO;
import cn.iocoder.yudao.framework.common.util.spring.SpringUtils;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.*;
import org.springframework.web.context.request.*;
import org.springframework.web.method.HandlerMethod;
import org.springframework.validation.*;
import java.nio.charset.StandardCharsets;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SensitiveEndpointLoggingTest {
    static final String SECRET = "parent-private-13800138000";
    final ApiErrorLogCommonApi api = mock(ApiErrorLogCommonApi.class);
    final GlobalExceptionHandler handler = new GlobalExceptionHandler("test", api);
    final ListAppender<ILoggingEvent> output = new ListAppender<>();
    final Logger exceptions = (Logger) LoggerFactory.getLogger(GlobalExceptionHandler.class);
    final Logger access = (Logger) LoggerFactory.getLogger(ApiAccessLogInterceptor.class);
    static class Endpoints {
        @ApiAccessLog(requestEnable = false) public void sensitive() {}
        public void ordinary() {}
    }
    @BeforeEach void start() { output.start(); exceptions.addAppender(output); access.addAppender(output); }
    @AfterEach void stop() { exceptions.detachAppender(output); access.detachAppender(output); RequestContextHolder.resetRequestAttributes(); }
    MockHttpServletRequest request(String endpoint) throws Exception {
        var request = new MockHttpServletRequest("POST", "/" + endpoint);
        // Mirror the web filter metadata; this unit fixture does not bootstrap WebProperties.
        cn.iocoder.yudao.framework.web.core.util.WebFrameworkUtils.setLoginUserType(request, 1);
        request.setContentType("application/json");
        request.setContent(("{\"contact\":\"" + SECRET + "\"}").getBytes(StandardCharsets.UTF_8));
        request.addParameter("contact", SECRET);
        request.setAttribute(ApiAccessLogInterceptor.ATTRIBUTE_HANDLER_METHOD, new HandlerMethod(new Endpoints(), endpoint));
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        return request;
    }
    void assertNoSecretLogged() {
        for (var entry : output.list) {
            assertFalse(entry.getFormattedMessage().contains(SECRET), entry.getFormattedMessage());
            assertNull(entry.getThrowableProxy(), "Sensitive endpoint must not log exception/cause messages");
        }
    }
    @Test void unexpectedFailureRetainsDiagnosticsWithoutPayloadOrExceptionValues() throws Exception {
        var request = request("sensitive");
        var exception = new IllegalStateException(SECRET, new RuntimeException(SECRET));
        handler.defaultExceptionHandler(request, exception);
        var capture = ArgumentCaptor.forClass(ApiErrorLogCreateReqDTO.class);
        verify(api).createApiErrorLogAsync(capture.capture());
        var recorded = capture.getValue();
        assertNull(recorded.getRequestParams());
        assertEquals(IllegalStateException.class.getName(), recorded.getExceptionName());
        assertEquals("/sensitive", recorded.getRequestUrl());
        assertEquals(1, recorded.getUserType());
        assertFalse(recorded.getExceptionMessage().contains(SECRET));
        assertFalse(recorded.getExceptionRootCauseMessage().contains(SECRET));
        assertFalse(recorded.getExceptionStackTrace().contains(SECRET));
        assertTrue(recorded.getExceptionStackTrace().contains("SensitiveEndpointLoggingTest"));
        assertNoSecretLogged();
    }
    @Test void ordinaryEndpointsStillHaveFullDiagnostics() throws Exception {
        handler.defaultExceptionHandler(request("ordinary"), new IllegalStateException(SECRET));
        var capture = ArgumentCaptor.forClass(ApiErrorLogCreateReqDTO.class);
        verify(api).createApiErrorLogAsync(capture.capture());
        assertTrue(capture.getValue().getRequestParams().contains(SECRET));
        assertTrue(capture.getValue().getExceptionMessage().contains(SECRET));
        assertTrue(output.list.stream().anyMatch(event -> event.getThrowableProxy() != null));
    }
    @Test void bindingFailureDoesNotLogRejectedValuesOrReflectThemIntoAccessResult() throws Exception {
        request("sensitive");
        var result = new BeanPropertyBindingResult(new Object(), "submission");
        result.addError(new FieldError("submission", "contact", SECRET, true, null, null, "Invalid " + SECRET));
        var response = handler.bindExceptionHandler(new BindException(result));
        assertEquals(400, response.getCode());
        assertFalse(response.getMsg().contains(SECRET));
        assertNoSecretLogged();
        verifyNoInteractions(api);
    }
    @Test void developmentInterceptorHonorsAnnotationButKeepsSafeTimingLogs() throws Exception {
        var request = request("sensitive");
        var interceptor = new ApiAccessLogInterceptor();
        Object method = request.getAttribute(ApiAccessLogInterceptor.ATTRIBUTE_HANDLER_METHOD);
        try (var spring = mockStatic(SpringUtils.class)) {
            spring.when(SpringUtils::isProd).thenReturn(false);
            assertTrue(interceptor.preHandle(request, new MockHttpServletResponse(), method));
            interceptor.afterCompletion(request, new MockHttpServletResponse(), method, null);
        }
        assertTrue(output.list.stream().anyMatch(event -> event.getFormattedMessage().contains("/sensitive")));
        assertNoSecretLogged();
    }
}
