package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.module.edu.dal.dataobject.EduTeacherProfileDO;
import cn.iocoder.yudao.module.edu.dal.mysql.EduTeacherProfileMapper;
import cn.iocoder.yudao.module.system.api.user.AdminUserApi;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import java.util.*;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;

/** Public teaching profile eligibility; the original staff identity remains authoritative. */
@Service
public class EduTeacherService {
    @Resource private EduTeacherProfileMapper teachers;
    @Resource private AdminUserApi users;

    public boolean acceptsOneToOne(EduTeacherProfileDO teacher) {
        if (teacher == null || !"PUBLISHED".equals(teacher.getStatus())
                || !Boolean.TRUE.equals(teacher.getOneToOneEnabled())
                || teacher.getBio() == null || teacher.getBio().isBlank()) return false;
        var user = users.getUser(teacher.getUserId());
        return user != null && Objects.equals(user.getStatus(), 0);
    }

    public EduTeacherProfileDO requireOneToOne(Long id) {
        require(id != null && id > 0, "请选择一对一授课老师");
        var teacher = teachers.selectOneForUpdate(EduTeacherProfileDO::getId, id);
        require(acceptsOneToOne(teacher), "该老师暂未开放一对一预约，请重新选择");
        return teacher;
    }

    public List<Map<String,Object>> publicList(boolean oneToOne) {
        return teachers.selectList(new LambdaQueryWrapper<EduTeacherProfileDO>()
                .eq(EduTeacherProfileDO::getStatus, "PUBLISHED")
                .eq(oneToOne, EduTeacherProfileDO::getOneToOneEnabled, true)
                .orderByAsc(EduTeacherProfileDO::getId)).stream()
                .filter(t -> !oneToOne || acceptsOneToOne(t)).map(t -> {
                    Map<String,Object> v = new LinkedHashMap<>();
                    v.put("id", t.getId()); v.put("name", t.getName()); v.put("bio", t.getBio());
                    v.put("avatarUrl", t.getAvatarUrl()); v.put("oneToOneEnabled", acceptsOneToOne(t));
                    return v;
                }).toList();
    }
}
