package com.sbams.controller;

import com.sbams.dto.AssignmentRequest;
import com.sbams.dto.AssignmentResponse;
import com.sbams.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AssignmentResponse> assign(@Valid @RequestBody AssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.assignAsset(request));
    }

    @PutMapping("/{id}/return")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AssignmentResponse> returnAsset(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.returnAsset(id));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AssignmentResponse>> byEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByEmployee(employeeId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AssignmentResponse>> getAll() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }
}
