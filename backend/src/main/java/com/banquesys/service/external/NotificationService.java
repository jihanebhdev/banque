package com.banquesys.service.external;

public interface NotificationService {
    void sendEmail(String to, String subject, String bodyHtml);
    void sendSms(String to, String message);
}
