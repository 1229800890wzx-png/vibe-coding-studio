package cn.iocoder.yudao.module.edu.controller.vo;

public record EduWebsiteOfferingRespVO(Long id, String slug, String title, String description,
                                       String outline, Integer stage, String image, Integer sortOrder,
                                       Boolean published, Long courseId, Integer revision) {}
