package com.banquesys.repository;

import com.banquesys.model.AuditLog;
import com.banquesys.model.AuditSeverity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Read-only repository for audit logs.
 * No delete or update methods should be exposed — audit logs are immutable.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    Page<AuditLog> findByActorIdOrderByTimestampDesc(Long actorId, Pageable pageable);

    Page<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);

    Page<AuditLog> findBySeverityOrderByTimestampDesc(AuditSeverity severity, Pageable pageable);

    Page<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime from, LocalDateTime to, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:severity IS NULL OR a.severity = :severity) AND " +
           "(:actorId IS NULL OR a.actorId = :actorId) AND " +
           "(:from IS NULL OR a.timestamp >= :from) AND " +
           "(:to IS NULL OR a.timestamp <= :to) " +
           "ORDER BY a.timestamp DESC")
    Page<AuditLog> searchLogs(
            @Param("action") String action,
            @Param("severity") AuditSeverity severity,
            @Param("actorId") Long actorId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    long countBySeverity(AuditSeverity severity);

    long countByAction(String action);

    @Query("SELECT a.actorEmail, COUNT(a) FROM AuditLog a WHERE a.actorRole = 'ROLE_EMPLOYE' AND a.timestamp >= :since GROUP BY a.actorEmail")
    List<Object[]> countActionsByAdvisor(@Param("since") LocalDateTime since);
}
