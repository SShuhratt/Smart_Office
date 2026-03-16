package com.sbams.dto;

import com.sbams.model.AssetStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusUpdateRequest {
    @NotNull
    private AssetStatus status;
    private String reason;
}
