package com.sbams.dto;

import com.sbams.model.AssetStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AssignmentRequest {
    @NotNull
    private Long assetId;
    @NotNull
    private Long employeeId;
    private String notes;
}
