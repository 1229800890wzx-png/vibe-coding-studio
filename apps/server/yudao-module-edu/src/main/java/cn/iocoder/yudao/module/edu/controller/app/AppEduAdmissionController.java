package cn.iocoder.yudao.module.edu.controller.app;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.framework.common.validation.Mobile;
import cn.iocoder.yudao.module.edu.service.EduAdmissionService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@RestController @RequestMapping("/edu/admission") @Validated
public class AppEduAdmissionController {
    @Resource private EduAdmissionService admissions;
    public record ConsultationRequest(@NotNull Long studentId, Long courseId, @NotBlank @Size(max=50) String contactName,
            @NotBlank @Mobile String mobile, @Size(max=1000) String message, @NotNull Boolean contactConsent,
            @NotBlank String consentVersion, Long trialBookingId,
            @Pattern(regexp="COURSE|ONE_TO_ONE") String serviceType, Long teacherId,
            @Size(max=32) String preferredStartTime, @Size(max=32) String preferredEndTime) {}
    public record TrialLinkRequest(@NotNull Long clueId, @NotNull Long trialBookingId) {}
    public record CancelRequest(@NotNull @Positive Long id) {}
    @GetMapping("/options") public CommonResult<Map<String,Object>> options() { return success(admissions.options()); }
    @PostMapping("/create") public CommonResult<Map<String,Object>> create(@Valid @RequestBody ConsultationRequest r) {
        return success(admissions.create(r.studentId(),r.courseId(),r.contactName(),r.mobile(),r.message(),r.contactConsent(),r.consentVersion(),r.trialBookingId(),r.serviceType(),r.teacherId(),r.preferredStartTime(),r.preferredEndTime()));
    }
    @GetMapping("/list") public CommonResult<List<Map<String,Object>>> list(@RequestParam(required=false) Long studentId) { return success(admissions.list(studentId)); }
    @PostMapping("/link-trial") public CommonResult<Boolean> link(@Valid @RequestBody TrialLinkRequest r) { admissions.linkTrial(r.clueId(),r.trialBookingId()); return success(true); }
    @PostMapping("/cancel") public CommonResult<Map<String,Object>> cancel(@Valid @RequestBody CancelRequest r) { return success(admissions.cancel(r.id())); }
}
