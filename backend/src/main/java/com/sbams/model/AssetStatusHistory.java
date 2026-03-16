package com.sbams.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "asset_status_history")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AssetStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Enumerated(EnumType.STRING)
    private AssetStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetStatus newStatus;

    private String changedBy;

    private String reason;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime changedAt;
}
