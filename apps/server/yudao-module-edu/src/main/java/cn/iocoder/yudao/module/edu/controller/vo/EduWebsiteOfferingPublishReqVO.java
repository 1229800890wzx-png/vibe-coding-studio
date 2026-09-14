package cn.iocoder.yudao.module.edu.controller.vo;

import jakarta.validation.constraints.*;

public record EduWebsiteOfferingPublishReqVO(@NotNull @Positive Long id,
                                             @NotNull @Positive Integer revision,
                                             @NotNull Boolean published) {}
