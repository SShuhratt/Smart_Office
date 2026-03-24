package com.sbams.service;

import com.sbams.audit.AuditService;
import com.sbams.dto.AssignmentResponse;
import com.sbams.dto.EmployeeRequest;
import com.sbams.dto.EmployeeResponse;
import com.sbams.model.*;
import com.sbams.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final AssetAssignmentRepository assignmentRepository;
    private final AssetRepository assetRepository;
    private final AssetStatusHistoryRepository statusHistoryRepository;
    private final SystemUserRepository systemUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }
        Employee employee = Employee.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .department(request.getDepartment())
                .position(request.getPosition())
                .build();
        employee = employeeRepository.save(employee);

        // Create login account for the employee
        String username = (request.getUsername() != null && !request.getUsername().isBlank())
                ? request.getUsername()
                : request.getEmail();
        String password = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword()
                : "user123";

        if (!systemUserRepository.existsByUsername(username)) {
            systemUserRepository.save(SystemUser.builder()
                    .username(username)
                    .password(passwordEncoder.encode(password))
                    .role(Role.USER)
                    .fullName(request.getFullName())
                    .email(request.getEmail())
                    .build());
        }

        auditService.log("EMPLOYEE_CREATED", "Employee", employee.getId(), "Employee added: " + employee.getFullName());
        return toResponse(employee);
    }

    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public EmployeeResponse getEmployeeById(Long id) {
        return toResponse(findById(id));
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        Employee employee = findById(id);
        employee.setFullName(request.getFullName());
        employee.setDepartment(request.getDepartment());
        employee.setPosition(request.getPosition());
        employeeRepository.save(employee);
        auditService.log("EMPLOYEE_UPDATED", "Employee", id, "Updated: " + employee.getFullName());
        return toResponse(employee);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = findById(id);

        // Return all active assets
        List<AssetAssignment> activeAssignments = assignmentRepository.findByEmployeeId(id).stream()
                .filter(AssetAssignment::isActive)
                .collect(Collectors.toList());
        for (AssetAssignment assignment : activeAssignments) {
            Asset asset = assignment.getAsset();
            recordStatusChange(asset, AssetStatus.REGISTERED, "Employee deleted: " + employee.getFullName());
            asset.setStatus(AssetStatus.REGISTERED);
            assetRepository.save(asset);
        }

        // Remove linked system user account
        systemUserRepository.findByUsername(employee.getEmail()).ifPresent(systemUserRepository::delete);

        employeeRepository.delete(employee);
        auditService.log("EMPLOYEE_DELETED", "Employee", id, "Deleted: " + employee.getFullName());
    }

    private Employee findById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Employee not found: " + id));
    }

    private EmployeeResponse toResponse(Employee e) {
        List<AssignmentResponse> assignments = assignmentRepository.findByEmployeeId(e.getId()).stream()
                .filter(AssetAssignment::isActive)
                .map(this::toAssignmentResponse)
                .collect(Collectors.toList());

        return EmployeeResponse.builder()
                .id(e.getId())
                .fullName(e.getFullName())
                .email(e.getEmail())
                .department(e.getDepartment())
                .position(e.getPosition())
                .createdAt(e.getCreatedAt())
                .activeAssignments(assignments)
                .build();
    }

    private AssignmentResponse toAssignmentResponse(AssetAssignment a) {
        return AssignmentResponse.builder()
                .id(a.getId())
                .assetId(a.getAsset().getId())
                .assetName(a.getAsset().getName())
                .employeeId(a.getEmployee().getId())
                .employeeName(a.getEmployee().getFullName())
                .employeeEmail(a.getEmployee().getEmail())
                .employeeDepartment(a.getEmployee().getDepartment())
                .assignedAt(a.getAssignedAt())
                .returnedAt(a.getReturnedAt())
                .active(a.isActive())
                .notes(a.getNotes())
                .build();
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
}