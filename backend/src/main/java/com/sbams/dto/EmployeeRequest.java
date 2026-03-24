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
    private String phone;
    /** Login username for the employee's system account. Defaults to email if blank. */
    private String username;
    /** Login password. Required when creating a new employee. */
    private String password;
}