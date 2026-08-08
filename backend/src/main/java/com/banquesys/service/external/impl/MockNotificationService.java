package com.banquesys.service.external.impl;

import com.banquesys.service.external.NotificationService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "banquesys.service.notification", havingValue = "mock", matchIfMissing = true)
public class MockNotificationService implements NotificationService {

    @Override
    public void sendEmail(String to, String subject, String bodyHtml) {
        System.out.println("[MOCK EMAIL] To: " + to + " | Subject: " + subject);
    }

    @Override
    public void sendSms(String to, String message) {
        System.out.println("[MOCK SMS] To: " + to + " | Msg: " + message);
    }
}
