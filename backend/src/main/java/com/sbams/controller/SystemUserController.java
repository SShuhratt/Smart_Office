package com.sbams.controller;

import com.sbams.dto.SystemUserRequest;
import com.sbams.dto.SystemUserResponse;
import com.sbams.model.Role;
import com.sbams.model.SystemUser;
import com.sbams.repository.SystemUserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/system-users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SystemUserController {

    private final SystemUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<SystemUserResponse>> list() {
        return ResponseEntity.ok(
            userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList())
        );
    }

    @PostMapping
    public ResponseEntity<SystemUserResponse> create(@Valid @RequestBody SystemUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }
        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + request.getRole());
        }
        if (role == Role.ADMIN) {
            throw new IllegalArgumentException("Admin accounts cannot be created through this endpoint.");
        }
        SystemUser user = SystemUser.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .fullName(request.getFullName())
                .email(request.getEmail())
                .build();
        user = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        SystemUser user = userRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found: " + id));
        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Admin accounts cannot be deleted through this endpoint.");
        }
        userRepository.delete(user);
        return ResponseEntity.noContent().build();
    }

    private SystemUserResponse toResponse(SystemUser u) {
        return SystemUserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .role(u.getRole().name())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .enabled(u.isEnabled())
                .build();
    }
}
