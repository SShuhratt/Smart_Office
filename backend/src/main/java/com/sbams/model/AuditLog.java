package com.sbams.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action;

    private String entityType;

    private Long entityId;

    @Column(columnDefinition = "TEXT")
    private String details;

    private String performedBy;

    @Builder.Default
    private LocalDateTime performedAt = LocalDateTime.now();
}
