package com.sbams.dto;

import com.sbams.model.AssetStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class StatusHistoryResponse {
    private Long id;
    private AssetStatus previousStatus;
    private AssetStatus newStatus;
    private String changedBy;
    private String reason;
    private LocalDateTime changedAt;
}
