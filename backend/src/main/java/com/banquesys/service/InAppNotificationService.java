package com.banquesys.service;

import com.banquesys.model.Client;
import com.banquesys.model.Notification;
import com.banquesys.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InAppNotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public void createNotification(Client client, String text) {
        try {
            if (client == null) return;
            Notification notification = new Notification(client, text);
            notificationRepository.save(notification);
            System.out.println("[IN-APP NOTIFICATION] Saved notification for client " + client.getEmail() + ": " + text);
        } catch (Exception e) {
            System.err.println("Failed to save in-app notification: " + e.getMessage());
        }
    }
}
