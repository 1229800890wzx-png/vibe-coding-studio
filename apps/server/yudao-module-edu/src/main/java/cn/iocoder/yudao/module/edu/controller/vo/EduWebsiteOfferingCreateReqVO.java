package cn.iocoder.yudao.module.edu.controller.vo;

import jakarta.validation.constraints.*;

public record EduWebsiteOfferingCreateReqVO(
    @NotBlank @Pattern(regexp = "[a-z0-9-]{1,40}") String slug,
    @NotBlank @Size(max = 80) String title,
    @NotBlank @Size(max = 600) String description,
    @Size(max = 2000) String outline,
    @NotNull @Min(1) @Max(3) Integer stage,
    @NotBlank @Pattern(regexp = "minecraft|museum|notes") String image,
    @NotNull @Min(0) @Max(999) Integer sortOrder,
    @Positive Long courseId) {}
