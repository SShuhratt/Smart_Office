package com.sbams.service;

import com.sbams.audit.AuditService;
import com.sbams.dto.AssignmentRequest;
import com.sbams.dto.AssignmentResponse;
import com.sbams.model.*;
import com.sbams.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssetAssignmentRepository assignmentRepository;
    private final AssetRepository assetRepository;
    private final EmployeeRepository employeeRepository;
    private final AssetStatusHistoryRepository statusHistoryRepository;
    private final AuditService auditService;
    @Lazy
    private final AssetService assetService;

    @Transactional
    public AssignmentResponse assignAsset(AssignmentRequest request) {
        Asset asset = assetRepository.findById(request.getAssetId())
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Asset not found"));

        if (assignmentRepository.existsByAssetIdAndActiveTrue(request.getAssetId())) {
            throw new IllegalStateException("Asset is already assigned. Return it first.");
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Employee not found"));

        if (assignmentRepository.existsByEmployeeIdAndActiveTrue(request.getEmployeeId())) {
            throw new IllegalStateException("Employee already has an assigned asset. Return it first.");
        }

        AssetAssignment assignment = AssetAssignment.builder()
                .asset(asset)
                .employee(employee)
                .notes(request.getNotes())
                .active(true)
                .build();
        assignment = assignmentRepository.save(assignment);

        recordStatusChange(asset, AssetStatus.ASSIGNED, "Assigned to " + employee.getFullName());
        asset.setStatus(AssetStatus.ASSIGNED);
        assetRepository.save(asset);

        assetService.regenerateQr(asset, assignment);

        auditService.log("ASSET_ASSIGNED", "AssetAssignment", assignment.getId(),
                "Asset " + asset.getName() + " assigned to " + employee.getFullName());

        return toResponse(assignment);
    }

    @Transactional
    public AssignmentResponse returnAsset(Long assignmentId) {
        AssetAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Assignment not found"));

        if (!assignment.isActive()) {
            throw new IllegalStateException("Assignment is already closed.");
        }

        // Security check
        String role = getCurrentUserRole();
        String username = getCurrentUsername();
        if (!"ADMIN".equals(role) && !assignment.getEmployee().getEmail().equals(username)) {
            throw new SecurityException("Access denied: You cannot return this asset.");
        }

        assignment.setActive(false);
        assignment.setReturnedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        Asset asset = assignment.getAsset();
        recordStatusChange(asset, AssetStatus.REGISTERED, "Returned by " + assignment.getEmployee().getFullName());
        asset.setStatus(AssetStatus.REGISTERED);
        assetRepository.save(asset);

        assetService.regenerateQr(asset, null);

        auditService.log("ASSET_RETURNED", "AssetAssignment", assignmentId,
                "Asset " + asset.getName() + " returned");

        return toResponse(assignment);
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }

    private String getCurrentUserRole() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                    .stream().findFirst().get().getAuthority().replace("ROLE_", "");
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }

    public List<AssignmentResponse> getAssignmentsByEmployee(Long employeeId) {
        return assignmentRepository.findByEmployeeId(employeeId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AssignmentResponse> getAllAssignments() {
        return assignmentRepository.findByActiveTrue()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private void recordStatusChange(Asset asset, AssetStatus newStatus, String reason) {
        statusHistoryRepository.save(AssetStatusHistory.builder()
                .asset(asset)
                .previousStatus(asset.getStatus())
                .newStatus(newStatus)
                .changedBy("system")
                .reason(reason)
                .build());
    }

    private AssignmentResponse toResponse(AssetAssignment a) {
        return AssignmentResponse.builder()
                .id(a.getId())
                .assetId(a.getAsset().getId())
                .assetName(a.getAsset().getName())
                .employeeId(a.getEmployee().getId())
                .employeeName(a.getEmployee().getFullName())
                .employeeEmail(a.getEmployee().getEmail())
                .assignedAt(a.getAssignedAt())
                .returnedAt(a.getReturnedAt())
                .active(a.isActive())
                .notes(a.getNotes())
                .build();
    }
}