package com.sbams.dto;

import com.sbams.model.AssetStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AssetResponse {
    private Long id;
    private String name;
    private String category;
    private String serialNumber;
    private AssetStatus status;
    private String qrCodeBase64;
    private String imageBase64;
    private String location;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private AssignmentResponse activeAssignment;
    private List<StatusHistoryResponse> statusHistory;
}