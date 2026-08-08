package com.banquesys.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Immutable audit log entity — append-only, never updated or deleted.
 * Tracks every sensitive operation in the banking system for regulatory compliance.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
    @Index(name = "idx_audit_actor", columnList = "actorId"),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_severity", columnList = "severity")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    // WHO performed the action
    @Column(updatable = false)
    private Long actorId;

    @Column(updatable = false)
    private String actorEmail;

    @Column(updatable = false)
    private String actorRole;

    // WHAT was done
    @Column(nullable = false, updatable = false, length = 100)
    private String action;

    // ON WHICH entity
    @Column(updatable = false, length = 50)
    private String entityType;

    @Column(updatable = false)
    private Long entityId;

    // Human-readable description
    @Column(updatable = false, columnDefinition = "TEXT")
    private String details;

    // WHERE (network context)
    @Column(updatable = false)
    private String ipAddress;

    @Column(updatable = false, length = 500)
    private String userAgent;

    // Outcome
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false)
    private AuditSeverity severity = AuditSeverity.INFO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false)
    private AuditStatus status = AuditStatus.SUCCESS;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }

    public AuditLog(Long actorId, String actorEmail, String actorRole,
                    String action, String entityType, Long entityId,
                    String details, String ipAddress, String userAgent,
                    AuditSeverity severity, AuditStatus status) {
        this.timestamp = LocalDateTime.now();
        this.actorId = actorId;
        this.actorEmail = actorEmail;
        this.actorRole = actorRole;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.details = details;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.severity = severity != null ? severity : AuditSeverity.INFO;
        this.status = status != null ? status : AuditStatus.SUCCESS;
    }
}
