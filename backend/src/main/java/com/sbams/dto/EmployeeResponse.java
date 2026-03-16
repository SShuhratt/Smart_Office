package com.sbams.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class EmployeeResponse {
    private Long id;
    private String fullName;
    private String email;
    private String department;
    private String position;
    private LocalDateTime createdAt;
    private List<AssignmentResponse> activeAssignments;
}
