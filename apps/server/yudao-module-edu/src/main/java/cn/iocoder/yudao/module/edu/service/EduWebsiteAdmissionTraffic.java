package cn.iocoder.yudao.module.edu.service;

import cn.hutool.crypto.digest.DigestUtil;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import java.util.*;
import static cn.iocoder.yudao.module.edu.service.EduRules.require;

/** Atomic fixed window limiter. No contact data or request IDs occur in its keys. */
@Component
public class EduWebsiteAdmissionTraffic {
    private static final DefaultRedisScript<Long> INCREMENT = new DefaultRedisScript<>(
            "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return n", Long.class);
    @Resource private StringRedisTemplate redis;
    @Value("${edu.website-admission.rate-window-seconds:60}") private int windowSeconds;
    @Value("${edu.website-admission.create-limit:10}") private int createLimit;
    @Value("${edu.website-admission.options-limit:60}") private int optionsLimit;
    @Value("${edu.website-admission.trusted-proxies:127.0.0.1,::1,0:0:0:0:0:0:0:1}") private String trustedProxies;

    public void check(String endpoint, Long tenant, HttpServletRequest request) {
        require(Set.of("create", "options").contains(endpoint), "请求无效");
        require(windowSeconds > 0 && createLimit > 0 && optionsLimit > 0, "咨询服务限流未配置");
        String peer = clientIp(request.getRemoteAddr(), request.getHeader("X-Vibe-Client-IP"), trustedProxies);
        String key = "edu:website-admission:" + endpoint + ":" + tenant + ":" + DigestUtil.sha256Hex(peer);
        Long count = redis.execute(INCREMENT, List.of(key), String.valueOf(windowSeconds));
        if (count == null || count > ("create".equals(endpoint) ? createLimit : optionsLimit))
            throw new cn.iocoder.yudao.framework.common.exception.ServiceException(
                    EduWebsiteAdmissionErrorCodes.RATE_LIMITED, "提交频繁，请稍后重试");
    }

    static String clientIp(String remote, String forwarded, String configured) {
        require(validIp(remote), "客户端地址无效");
        boolean trusted = configured != null && Arrays.stream(configured.split(",")).map(String::trim).anyMatch(remote::equals);
        if (trusted && forwarded != null) {
            require(validIp(forwarded), "客户端地址无效");
            return forwarded;
        }
        return remote;
    }

    static boolean validIp(String value) {
        if (value == null || value.length() > 45) return false;
        if (value.contains(":")) {
            if (!value.matches("[0-9a-fA-F:.]+")) return false;
            try { return java.net.InetAddress.getByName(value) instanceof java.net.Inet6Address; }
            catch (java.net.UnknownHostException e) { return false; }
        }
        String[] parts = value.split("\\.", -1);
        if (parts.length != 4) return false;
        for (String part : parts) {
            if (!part.matches("[0-9]{1,3}") || Integer.parseInt(part) > 255) return false;
        }
        return true;
    }
}
