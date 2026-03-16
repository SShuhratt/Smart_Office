package com.sbams.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmployeeRequest {
    @NotBlank
    private String fullName;
    @NotBlank @Email
    private String email;
    private String department;
    private String position;
}
