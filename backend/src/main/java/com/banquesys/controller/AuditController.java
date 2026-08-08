package com.banquesys.controller;

import com.banquesys.model.AuditLog;
import com.banquesys.model.AuditSeverity;
import com.banquesys.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin/audit-logs")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AuditController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * GET /api/admin/audit-logs
     * Paginated list of all audit logs, most recent first.
     */
    @GetMapping
    public ResponseEntity<?> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampDesc(pageable);
        return ResponseEntity.ok(logs);
    }

    /**
     * GET /api/admin/audit-logs/search
     * Multi-criteria filtered + paginated search.
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        AuditSeverity sev = null;
        if (severity != null && !severity.isBlank()) {
            try {
                sev = AuditSeverity.valueOf(severity.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        Page<AuditLog> logs = auditLogRepository.searchLogs(
                (action != null && !action.isBlank()) ? action : null,
                sev,
                actorId,
                from,
                to,
                pageable);
        return ResponseEntity.ok(logs);
    }

    /**
     * GET /api/admin/audit-logs/stats
     * Summary counts by severity and top actions — for dashboard widgets.
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", auditLogRepository.count());
        stats.put("success", auditLogRepository.countBySeverity(AuditSeverity.SUCCESS));
        stats.put("info", auditLogRepository.countBySeverity(AuditSeverity.INFO));
        stats.put("warning", auditLogRepository.countBySeverity(AuditSeverity.WARNING));
        stats.put("error", auditLogRepository.countBySeverity(AuditSeverity.ERROR));
        stats.put("critical", auditLogRepository.countBySeverity(AuditSeverity.CRITICAL));
        return ResponseEntity.ok(stats);
    }
}
