package com.banquesys.service;

import com.banquesys.model.AuditLog;
import com.banquesys.model.AuditSeverity;
import com.banquesys.model.AuditStatus;
import com.banquesys.repository.AuditLogRepository;
import com.banquesys.security.UserDetailsImpl;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Central audit logging service for the entire banking application.
 * All sensitive operations MUST call this service to produce an immutable audit trail.
 *
 * This service:
 * - Automatically extracts the current user from SecurityContextHolder
 * - Automatically extracts IP and User-Agent from the current HTTP request
 * - Persists the log entry to PostgreSQL (append-only)
 */
@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * Log an audit event with full context.
     */
    public void log(String action, String entityType, Long entityId,
                    String details, AuditSeverity severity, AuditStatus status) {
        Long actorId = null;
        String actorEmail = "SYSTEM";
        String actorRole = "SYSTEM";

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserDetailsImpl) {
                UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
                actorId = userDetails.getId();
                actorEmail = userDetails.getUsername();
                actorRole = userDetails.getRole();
            }
        } catch (Exception e) {
            // If security context is unavailable, proceed with SYSTEM actor
        }

        String ipAddress = "unknown";
        String userAgent = "unknown";

        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                ipAddress = extractClientIp(request);
                userAgent = request.getHeader("User-Agent");
                if (userAgent == null) userAgent = "unknown";
                // Truncate user-agent to 500 chars
                if (userAgent.length() > 500) userAgent = userAgent.substring(0, 500);
            }
        } catch (Exception e) {
            // If request context is unavailable, proceed with defaults
        }

        AuditLog entry = new AuditLog(
                actorId, actorEmail, actorRole,
                action, entityType, entityId,
                details, ipAddress, userAgent,
                severity, status
        );

        auditLogRepository.save(entry);
    }

    /**
     * Convenience: log a successful INFO-level event.
     */
    public void logInfo(String action, String entityType, Long entityId, String details) {
        log(action, entityType, entityId, details, AuditSeverity.INFO, AuditStatus.SUCCESS);
    }

    /**
     * Convenience: log a successful operation.
     */
    public void logSuccess(String action, String entityType, Long entityId, String details) {
        log(action, entityType, entityId, details, AuditSeverity.SUCCESS, AuditStatus.SUCCESS);
    }

    /**
     * Convenience: log a warning-level event (e.g., sensitive operations like password resets).
     */
    public void logWarning(String action, String entityType, Long entityId, String details) {
        log(action, entityType, entityId, details, AuditSeverity.WARNING, AuditStatus.SUCCESS);
    }

    /**
     * Convenience: log a failed operation.
     */
    public void logError(String action, String entityType, Long entityId, String details) {
        log(action, entityType, entityId, details, AuditSeverity.ERROR, AuditStatus.FAILURE);
    }

    /**
     * Convenience: log a critical security event.
     */
    public void logCritical(String action, String entityType, Long entityId, String details) {
        log(action, entityType, entityId, details, AuditSeverity.CRITICAL, AuditStatus.FAILURE);
    }

    /**
     * Extract client IP, respecting proxy headers (X-Forwarded-For).
     */
    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take the first IP in the chain (the original client)
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
