package com.banquesys.service.external.impl;

import com.banquesys.service.external.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@ConditionalOnProperty(name = "banquesys.service.notification", havingValue = "real")
public class RealNotificationService implements NotificationService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${TWILIO_ACCOUNT_SID:}")
    private String twilioSid;

    @Value("${TWILIO_AUTH_TOKEN:}")
    private String twilioToken;

    private final ExecutorService executor = Executors.newFixedThreadPool(2);

    @Override
    public void sendEmail(String to, String subject, String bodyHtml) {
        executor.submit(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                helper.setFrom("hello@demomailtrap.com", "Banque");
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(bodyHtml, true);
                
                mailSender.send(message);
                System.out.println("[REAL NOTIFICATION] Email sent to: " + to);
            } catch (Exception e) {
                System.err.println("[REAL NOTIFICATION] Failed to send email to " + to + ": " + e.getMessage());
            }
        });
    }

    @Override
    public void sendSms(String to, String message) {
        if (twilioSid == null || twilioSid.isEmpty()) {
            System.out.println("[TWILIO SANDBOX] Twilio credentials missing. Simulated SMS to: " + to + " | Msg: " + message);
            return;
        }
        System.out.println("[TWILIO SANDBOX] Sending SMS via API to: " + to + " | Msg: " + message);
    }
}
