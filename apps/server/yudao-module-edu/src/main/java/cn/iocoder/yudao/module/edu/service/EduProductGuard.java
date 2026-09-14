package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.dal.dataobject.EduCourseDO;
import cn.iocoder.yudao.module.edu.dal.mysql.EduCourseMapper;
import cn.iocoder.yudao.module.product.service.spu.ProductBusinessGuard;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Component;

@Component
public class EduProductGuard implements ProductBusinessGuard {
    @Resource private EduCourseMapper courses;
    @Override public void beforeCatalogMutation(Long spuId){EduRules.require(courses.selectCount(EduCourseDO::getSpuId,spuId)==0,"教育课程的规格和容量请在课程及班期工作台维护，不能删除或替换已绑定的规格");}
}
