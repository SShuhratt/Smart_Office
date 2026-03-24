package com.sbams.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SystemUserResponse {
    private Long id;
    private String username;
    private String role;
    private String fullName;
    private String email;
    private boolean enabled;
}