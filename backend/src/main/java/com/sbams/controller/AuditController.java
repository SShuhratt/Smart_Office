package com.sbams.controller;

import com.sbams.model.AuditLog;
import com.sbams.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
    public ResponseEntity<Page<AuditLog>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByPerformedAtDesc(PageRequest.of(page, size)));
    }

    @GetMapping("/{entityType}/{entityId}")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR')")
    public ResponseEntity<Page<AuditLog>> byEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLogRepository.findByEntityTypeAndEntityIdOrderByPerformedAtDesc(
                entityType, entityId, PageRequest.of(page, size)));
    }
}
