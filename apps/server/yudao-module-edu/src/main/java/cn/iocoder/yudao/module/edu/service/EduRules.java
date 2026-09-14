package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.framework.common.exception.ServiceException;
import java.time.*;
import java.util.*;

/** Education rules only. Authentication, price computation and payment remain upstream. */
public final class EduRules {
    private EduRules() {}
    public static void require(boolean condition, String message) {
        if (!condition) throw new ServiceException(1_090_000_001, message);
    }
    public static <T> T found(T value, String message) { require(value != null, message); return value; }
    public static String text(Map<String, Object> body, String name) {
        Object value = body.get(name); return value == null ? "" : String.valueOf(value).trim();
    }
    public static String requiredText(Map<String, Object> body, String name, int maximum) {
        String value=text(body,name); require(!value.isBlank() && value.length()<=maximum, name+"不能为空且长度不能超过"+maximum); return value;
    }
    public static Long id(Map<String, Object> body, String name) {
        Object v=body.get(name); if(v==null || String.valueOf(v).isBlank()) return null;
        try { long n=Long.parseLong(String.valueOf(v)); require(n>0,name+"无效"); return n; }
        catch(NumberFormatException ex) { throw new ServiceException(1_090_000_001,name+"无效"); }
    }
    public static int integer(Map<String,Object> b,String name,int fallback) {
        Object v=b.get(name); if(v==null||String.valueOf(v).isBlank()) return fallback;
        try { return Integer.parseInt(String.valueOf(v)); } catch(NumberFormatException ex) { throw new ServiceException(1_090_000_001,name+"必须为整数"); }
    }
    public static LocalDateTime time(Object value) {
        if(value==null||String.valueOf(value).isBlank()) return null;
        if(value instanceof Number n) return LocalDateTime.ofInstant(Instant.ofEpochMilli(n.longValue()),ZoneId.of("Asia/Shanghai"));
        try { String s=String.valueOf(value).replace(' ','T'); return s.length()==10?LocalDate.parse(s).atStartOfDay():LocalDateTime.parse(s); }
        catch(RuntimeException e) { throw new ServiceException(1_090_000_001,"日期时间格式无效"); }
    }
    public static boolean overlaps(LocalDateTime a,LocalDateTime b,LocalDateTime c,LocalDateTime d) { return a.isBefore(d)&&c.isBefore(b); }
    public static int age(String birthMonth, LocalDate on) {
        try { YearMonth birth=YearMonth.parse(birthMonth); require(!birth.isAfter(YearMonth.from(on)),"出生年月不能在未来"); return Period.between(birth.atDay(1),on).getYears(); }
        catch(DateTimeException e) { throw new ServiceException(1_090_000_001,"出生年月格式应为 YYYY-MM"); }
    }
    public static void validateRefund(int paid,int refunded,int pending,int request) {
        require(request>0 && refunded>=0 && pending>=0 && (long)refunded+pending+request<=paid,"退款金额超过订单项可退余额");
    }
    public static void validateTransfer(String sourceVersion,String targetVersion,int sourcePrice,int targetPrice,LocalDateTime start,LocalDateTime now) {
        require(start!=null&&start.isAfter(now),"首版仅支持开课前转班");
        require(Objects.equals(sourceVersion,targetVersion),"仅支持同课程版本和课次结构的班期");
        require(sourcePrice==targetPrice,"仅支持同价班期转班");
    }
}
