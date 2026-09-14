package cn.iocoder.yudao.module.edu.dal.mysql;

import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.module.edu.dal.dataobject.EduCourseDO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface EduCourseMapper extends BaseMapperX<EduCourseDO> {}
