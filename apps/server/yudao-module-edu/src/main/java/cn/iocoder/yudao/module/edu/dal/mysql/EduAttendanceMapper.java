package cn.iocoder.yudao.module.edu.dal.mysql;

import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.module.edu.dal.dataobject.EduAttendanceDO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface EduAttendanceMapper extends BaseMapperX<EduAttendanceDO> {}
