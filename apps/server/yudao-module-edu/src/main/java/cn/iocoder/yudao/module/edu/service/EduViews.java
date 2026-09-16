package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.framework.common.util.json.JsonUtils;
import java.util.*;

public final class EduViews {
    private EduViews() {}
    @SuppressWarnings("unchecked")
    public static Map<String,Object> map(Object object) {
        if(object==null) return new LinkedHashMap<>();
        Map<String,Object> value=JsonUtils.parseObject(JsonUtils.toJsonString(object),Map.class);
        value.remove("tenantId");value.remove("deleted");value.remove("creator");value.remove("updater");value.remove("transMap");
        return new LinkedHashMap<>(value);
    }
    @SuppressWarnings("unchecked") public static List<Map<String,Object>> objects(String json) {
        if(json==null||json.isBlank()||"null".equals(json)) return new ArrayList<>();
        return JsonUtils.parseObject(json,List.class);
    }
    public static String json(Object object) { return JsonUtils.toJsonString(object==null?List.of():object); }
    public static Map<String,Object> page(List<?> rows,int number,int size) {
        int safeSize=Math.min(Math.max(size,1),100), from=Math.min(Math.max(number-1,0)*safeSize,rows.size());
        Map<String,Object> result=new LinkedHashMap<>();result.put("list",rows.subList(from,Math.min(from+safeSize,rows.size())));result.put("total",rows.size());return result;
    }
}
