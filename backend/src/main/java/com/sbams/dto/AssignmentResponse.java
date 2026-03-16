package com.sbams.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AssignmentResponse {
    private Long id;
    private Long assetId;
    private String assetName;
    private Long employeeId;
    private String employeeName;
    private String employeeEmail;
    private String employeeDepartment;
    private LocalDateTime assignedAt;
    private LocalDateTime returnedAt;
    private boolean active;
    private String notes;
}
