package com.sbams.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SystemUserRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
    @NotBlank
    private String role; // ADMIN, AUDITOR, USER
    private String fullName;
    private String email;
}