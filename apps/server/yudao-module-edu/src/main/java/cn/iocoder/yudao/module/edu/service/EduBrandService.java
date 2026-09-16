package cn.iocoder.yudao.module.edu.service;

import cn.hutool.crypto.digest.DigestUtil;
import cn.iocoder.yudao.framework.common.util.json.JsonUtils;
import cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder;
import cn.iocoder.yudao.module.infra.controller.admin.config.vo.ConfigSaveReqVO;
import cn.iocoder.yudao.module.infra.dal.dataobject.config.ConfigDO;
import cn.iocoder.yudao.module.infra.dal.mysql.config.ConfigMapper;
import cn.iocoder.yudao.module.infra.service.config.ConfigService;
import cn.iocoder.yudao.module.system.dal.dataobject.tenant.TenantDO;
import cn.iocoder.yudao.module.system.dal.mysql.tenant.TenantMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;

/** A fixed public-brand form over original infra_config. No alternate configuration store. */
@Service
public class EduBrandService {
    @Resource private ConfigService configs;
    @Resource private ConfigMapper configMapper;
    @Resource private TenantMapper tenants;
    @Resource private EduAccessService access;
    private static final Map<String,String> DEFAULTS = Map.ofEntries(
        Map.entry("brandName","VIBE CODING"),Map.entry("tagline","少儿创造力实验室"),
        Map.entry("logoUrl",""),Map.entry("supportPhone",""),Map.entry("supportHours","工作日 09:00—18:00"),
        Map.entry("privacyUrl",""),Map.entry("termsUrl",""),
        Map.entry("heroTitle","一个好奇心。\n一个自己的作品。"),
        Map.entry("heroDescription","和 AI 一起，把想法写成现实。\n从第一条规则，到能分享的完整项目。"),
        Map.entry("heroAction","找到孩子的第一门课"),Map.entry("reducedMotionDefault","false"));

    private Map<String,String> values(boolean lock) {
        Map<String,String> result=new TreeMap<>();
        for(var entry:DEFAULTS.entrySet()){
            String key="edu.brand."+entry.getKey();
            ConfigDO stored=lock?configMapper.selectOneForUpdate(ConfigDO::getConfigKey,key):configs.getConfigByKey(key);
            result.put(entry.getKey(),stored==null||stored.getValue()==null||stored.getValue().isBlank()?entry.getValue():stored.getValue());
        }
        return result;
    }
    private static String revision(Map<String,String> values){return DigestUtil.sha256Hex(JsonUtils.toJsonString(values));}
    @Transactional(readOnly=true)
    public Map<String,Object> publicView(){Map<String,Object> view=new LinkedHashMap<>(values(false));view.put("reducedMotionDefault",Boolean.parseBoolean(String.valueOf(view.get("reducedMotionDefault"))));return view;}
    @Transactional(readOnly=true)
    public Map<String,Object> adminView(){access.permission("settings","query");Map<String,String> values=values(false);return Map.of("values",values,"revision",revision(values));}

    @Transactional(rollbackFor=Exception.class)
    public Map<String,Object> save(Map<String,Object> body){
        access.permission("settings","update");Long tenant=TenantContextHolder.getRequiredTenantId();
        require(tenant==1L,"此品牌配置入口只用于当前单品牌部署");
        found(tenants.selectOneForUpdate(TenantDO::getId,tenant),"品牌租户不存在");
        Map<String,String> previous=values(true);
        require(Objects.equals(text(body,"revision"),revision(previous)),"品牌配置已被更新，已保留输入，请刷新核对后再保存");
        require(body.get("values") instanceof Map<?,?>,"请填写品牌配置");
        Map<?,?> input=(Map<?,?>)body.get("values");
        for(Object key:input.keySet())require(DEFAULTS.containsKey(String.valueOf(key)),"包含不允许修改的配置项");
        for(String key:DEFAULTS.keySet()){
            if(!input.containsKey(key))continue;
            String value=Objects.toString(input.get(key),"").trim();require(value.length()<=500,"配置内容不能超过500字");
            if(Set.of("brandName","heroTitle","heroAction").contains(key))require(!value.isBlank(),"品牌名称、首页标题和按钮文字不能为空");
            if(key.endsWith("Url")&&!value.isBlank())require(value.matches("https://[^\\s]+")||value.matches("http://(127\\.0\\.0\\.1|localhost)(:[0-9]+)?/[^\\s]+"),"请使用 HTTPS 网址或本机测试地址");
            if("supportPhone".equals(key)&&!value.isBlank())require(value.matches("[+0-9() -]{5,30}"),"联系电话格式无效");
            if("reducedMotionDefault".equals(key))require(Set.of("true","false").contains(value),"动效选项无效");
            String configKey="edu.brand."+key;ConfigDO existing=configMapper.selectOneForUpdate(ConfigDO::getConfigKey,configKey);
            if(value.isBlank()){if(existing!=null)configs.deleteConfig(existing.getId());continue;}
            ConfigSaveReqVO request=new ConfigSaveReqVO().setId(existing==null?null:existing.getId()).setCategory("edu.brand").setName("品牌展示 · "+key).setKey(configKey).setValue(value).setVisible(false).setRemark("通过教学运营表单维护；公共接口只读取固定品牌字段");
            if(existing==null)configs.createConfig(request);else configs.updateConfig(request);
        }
        Map<String,String> updated=values(true);return Map.of("values",updated,"revision",revision(updated));
    }
}
