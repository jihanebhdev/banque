package com.banquesys.controller;

import com.banquesys.dto.response.MessageResponse;
import com.banquesys.model.Notification;
import com.banquesys.repository.NotificationRepository;
import com.banquesys.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("")
    public ResponseEntity<?> getNotifications() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        List<Notification> notifications = notificationRepository.findByClientIdOrderByDateCreationDesc(userDetails.getId());
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable."));

        if (!notification.getClient().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Vous n'êtes pas autorisé à modifier cette notification."));
        }

        notification.setReadStatus(true);
        notificationRepository.save(notification);
        return ResponseEntity.ok(new MessageResponse("Notification marquée comme lue."));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        List<Notification> notifications = notificationRepository.findByClientIdOrderByDateCreationDesc(userDetails.getId());
        for (Notification notification : notifications) {
            if (!notification.isReadStatus()) {
                notification.setReadStatus(true);
                notificationRepository.save(notification);
            }
        }
        return ResponseEntity.ok(new MessageResponse("Toutes les notifications ont été marquées comme lues."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable."));

        if (!notification.getClient().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Vous n'êtes pas autorisé à supprimer cette notification."));
        }

        notificationRepository.delete(notification);
        return ResponseEntity.ok(new MessageResponse("Notification supprimée."));
    }

    @DeleteMapping("/delete-all-read")
    public ResponseEntity<?> deleteAllRead() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        List<Notification> notifications = notificationRepository.findByClientIdOrderByDateCreationDesc(userDetails.getId());
        for (Notification notification : notifications) {
            if (notification.isReadStatus()) {
                notificationRepository.delete(notification);
            }
        }
        return ResponseEntity.ok(new MessageResponse("Toutes les notifications lues ont été supprimées."));
    }
}
