package cn.iocoder.yudao.module.edu.service;

import cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder;
import cn.iocoder.yudao.framework.common.exception.ServiceException;
import cn.iocoder.yudao.module.edu.controller.vo.*;
import cn.iocoder.yudao.module.edu.dal.dataobject.EduCourseDO;
import cn.iocoder.yudao.module.edu.dal.dataobject.EduWebsiteOfferingDO;
import cn.iocoder.yudao.module.edu.dal.mysql.EduCourseMapper;
import cn.iocoder.yudao.module.edu.dal.mysql.EduWebsiteOfferingMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.Resource;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

import static cn.iocoder.yudao.framework.security.core.util.SecurityFrameworkUtils.getLoginUserId;
import static cn.iocoder.yudao.module.edu.service.EduRules.*;

@Service
public class EduWebsiteOfferingService {
    @Resource private EduAccessService access;
    @Resource private EduWebsiteOfferingMapper offerings;
    @Resource private EduCourseMapper courses;

    @Transactional(readOnly = true)
    public List<EduWebsiteOfferingRespVO> publicList() {
        return offerings.selectList(new LambdaQueryWrapper<EduWebsiteOfferingDO>()
                .eq(EduWebsiteOfferingDO::getPublished, true)
                .orderByAsc(EduWebsiteOfferingDO::getSortOrder)
                .orderByAsc(EduWebsiteOfferingDO::getSlug))
            .stream().map(EduWebsiteOfferingService::response).toList();
    }

    @Transactional(readOnly = true)
    public List<EduWebsiteOfferingRespVO> adminList() {
        access.permission("website", "query");
        return offerings.selectList(new LambdaQueryWrapper<EduWebsiteOfferingDO>()
                .orderByAsc(EduWebsiteOfferingDO::getSortOrder)
                .orderByAsc(EduWebsiteOfferingDO::getSlug))
            .stream().map(EduWebsiteOfferingService::response).toList();
    }

    @Transactional(rollbackFor = Exception.class)
    public EduWebsiteOfferingRespVO create(EduWebsiteOfferingCreateReqVO request) {
        access.permission("website", "create");
        validateCourse(request.courseId());
        EduWebsiteOfferingDO row = new EduWebsiteOfferingDO();
        row.setSlug(request.slug());
        row.setTitle(request.title());
        row.setDescription(request.description());
        row.setOutline(Objects.requireNonNullElse(request.outline(), ""));
        row.setStage(request.stage());
        row.setImage(request.image());
        row.setSortOrder(request.sortOrder());
        row.setPublished(false);
        row.setCourseId(request.courseId());
        row.setRevision(1);
        try {
            offerings.insert(row);
        } catch (DuplicateKeyException ex) {
            throw duplicateSlug();
        }
        return response(found(offerings.selectById(row.getId()), "网站课程卡片创建失败"));
    }

    @Transactional(rollbackFor = Exception.class)
    public EduWebsiteOfferingRespVO update(EduWebsiteOfferingUpdateReqVO request) {
        access.permission("website", "update");
        EduWebsiteOfferingDO current = found(offerings.selectById(request.id()), "网站课程卡片不存在");
        require(Objects.equals(current.getSlug(), request.slug()), "slug 创建后不可修改");
        validateCourse(request.courseId());
        EduWebsiteOfferingDO row = new EduWebsiteOfferingDO();
        row.setId(request.id());
        row.setSlug(request.slug());
        row.setTitle(request.title());
        row.setDescription(request.description());
        row.setOutline(Objects.requireNonNullElse(request.outline(), ""));
        row.setStage(request.stage());
        row.setImage(request.image());
        row.setSortOrder(request.sortOrder());
        row.setCourseId(request.courseId());
        row.setUpdater(String.valueOf(getLoginUserId()));
        require(offerings.updateContent(row, TenantContextHolder.getRequiredTenantId(), request.revision()) == 1,
                "网站课程卡片已被更新，请刷新后合并修改");
        return response(found(offerings.selectById(request.id()), "网站课程卡片不存在"));
    }

    @Transactional(rollbackFor = Exception.class)
    public EduWebsiteOfferingRespVO publish(EduWebsiteOfferingPublishReqVO request) {
        access.permission("website", "publish");
        found(offerings.selectById(request.id()), "网站课程卡片不存在");
        require(offerings.updatePublished(request.id(), TenantContextHolder.getRequiredTenantId(), request.revision(),
                        request.published(), String.valueOf(getLoginUserId())) == 1,
                "网站课程卡片已被更新，请刷新后重试发布操作");
        return response(found(offerings.selectById(request.id()), "网站课程卡片不存在"));
    }

    private void validateCourse(Long courseId) {
        if (courseId == null) return;
        EduCourseDO course = found(courses.selectById(courseId), "关联的业务课程不存在");
        require(Objects.equals(course.getTenantId(), TenantContextHolder.getRequiredTenantId()), "关联的业务课程不属于当前租户");
    }

    private static RuntimeException duplicateSlug() {
        return new ServiceException(1_090_000_001, "slug 已存在或曾被使用，请选择新的 slug");
    }

    static EduWebsiteOfferingRespVO response(EduWebsiteOfferingDO row) {
        return new EduWebsiteOfferingRespVO(row.getId(), row.getSlug(), row.getTitle(), row.getDescription(),
                row.getOutline(), row.getStage(), row.getImage(), row.getSortOrder(), row.getPublished(),
                row.getCourseId(), row.getRevision());
    }
}
