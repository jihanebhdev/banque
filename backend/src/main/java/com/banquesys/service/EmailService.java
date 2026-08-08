package com.banquesys.service;

import io.mailtrap.client.MailtrapClient;
import io.mailtrap.config.MailtrapConfig;
import io.mailtrap.factory.MailtrapClientFactory;
import io.mailtrap.model.request.emails.Address;
import io.mailtrap.model.request.emails.MailtrapMail;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import com.banquesys.repository.GlobalConfigRepository;
import com.banquesys.model.GlobalConfig;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private GlobalConfigRepository configRepository;

    @Value("${mailtrap.token:f6f9ce8d24898eb231a7b11e5e3020d5}")
    private String mailtrapToken;

    private MailtrapClient mailtrapClient;
    private final ExecutorService executor = Executors.newFixedThreadPool(2);

    @PostConstruct
    public void init() {
        try {
            MailtrapConfig config = new MailtrapConfig.Builder()
                .token(mailtrapToken.trim())
                .build();
            this.mailtrapClient = MailtrapClientFactory.createMailtrapClient(config);
            System.out.println("MailtrapClient initialized successfully with token.");
        } catch (Exception e) {
            System.err.println("Failed to initialize MailtrapClient: " + e.getMessage());
        }
    }

    private GlobalConfig getActiveConfig() {
        try {
            List<GlobalConfig> configs = configRepository.findAll();
            if (!configs.isEmpty()) {
                return configs.get(0);
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch global config for email: " + e.getMessage());
        }
        GlobalConfig defaultConfig = new GlobalConfig();
        defaultConfig.setBankName("Banque");
        return defaultConfig;
    }

    private String getHtmlTemplate(String titleFr, String contentFr, String bankName, String logoUrl) {
        String logoHeaderHtml;
        if (logoUrl != null && !logoUrl.trim().isEmpty()) {
            logoHeaderHtml = "<img src=\"" + logoUrl + "\" alt=\"" + bankName + "\" style=\"max-height:48px; object-fit:contain;\" />";
        } else {
            logoHeaderHtml = "<span style=\"font-size:24px; font-weight:900; font-style:italic; color:#FFFFFF;\">"
                    + "  <span style=\"background-color:#30CFEF; color:#000000; padding:2px 8px; border-radius:4px; margin-right:8px; font-style:normal;\">" 
                    + (bankName.isEmpty() ? "B" : bankName.substring(0, 1).toUpperCase()) + "</span>" + bankName
                    + "</span>";
        }

        return "<div style=\"background-color:#050B14; color:#B8C4CC; font-family:'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding:30px; min-height:100vh; direction: ltr; text-align: left;\">"
                + "  <div style=\"max-width:600px; margin:0 auto; background-color:#07111F; border:1px solid rgba(66,232,255,0.15); border-radius:4px; padding:35px; box-shadow:0 10px 30px rgba(0,0,0,0.5);\">"
                + "    "
                + "    <!-- Logo Header -->"
                + "    <div style=\"margin-bottom:30px; border-bottom:1px solid rgba(66,232,255,0.1); padding-bottom:20px; display:block;\">"
                + "      " + logoHeaderHtml
                + "      <span style=\"float: right; color: #30CFEF; font-size: 14px; font-weight: bold; line-height: 32px;\">Conformité & Sécurité</span>"
                + "      <div style=\"clear: both;\"></div>"
                + "    </div>"
                + ""
                + "    <!-- French Content -->"
                + "    <div style=\"margin-bottom:30px;\">"
                + "      <h2 style=\"color:#FFFFFF; font-size:20px; margin-top:0; font-weight: 800;\">" + titleFr + "</h2>"
                + "      <div style=\"font-size:15px; line-height:1.6; color:#B8C4CC;\">" + contentFr + "</div>"
                + "    </div>"
                + ""
                + "    <!-- Footer -->"
                + "    <div style=\"margin-top:40px; padding-top:20px; border-top:1px solid rgba(66,232,255,0.1); font-size:11px; color:rgba(184,196,204,0.4); text-align:center;\">"
                + "      &copy; 2026 " + bankName + ". Cet e-mail est généré automatiquement par nos systèmes sécurisés."
                + "    </div>"
                + "  </div>"
                + "</div>";
    }

    public void sendWelcomeEmail(String toEmail, String clientName) {
        GlobalConfig config = getActiveConfig();
        String bankName = config.getBankName();
        String logoUrl = config.getLogoUrl();

        String titleFr = "Bienvenue chez " + bankName + " !";
        
        String contentFr = "<p>Bonjour <strong>" + clientName + "</strong>,</p>"
                + "<p>Nous sommes ravis de vous compter parmi nos clients. Votre compte " + bankName + " a été créé avec succès.</p>"
                + "<p>Veuillez compléter vos informations de profil (KYC) afin de faire valider votre accès par nos conseillers et activer votre espace client.</p>"
                + "<div style=\"text-align:center; margin:30px 0;\">"
                + "  <a href=\"http://localhost:3000/\" style=\"background-color:#30CFEF; color:#000000; text-decoration:none; padding:12px 30px; border-radius:4px; font-weight:bold; display:inline-block;\">Accéder à mon espace</a>"
                + "</div>";

        sendHtmlEmail(toEmail, "Bienvenue chez " + bankName, getHtmlTemplate(titleFr, contentFr, bankName, logoUrl), bankName);
    }

    public void sendPasswordResetEmail(String toEmail, String resetUrl) {
        GlobalConfig config = getActiveConfig();
        String bankName = config.getBankName();
        String logoUrl = config.getLogoUrl();

        String titleFr = "Demande de réinitialisation de mot de passe";

        String contentFr = "<p>Bonjour,</p>"
                + "<p>Nous avons reçu une demande pour réinitialiser le mot de passe de votre compte " + bankName + ".</p>"
                + "<p>Veuillez cliquer sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expirera dans 15 minutes.</p>"
                + "<div style=\"text-align:center; margin:30px 0;\">"
                + "  <a href=\"" + resetUrl + "\" style=\"background-color:#30CFEF; color:#000000; text-decoration:none; padding:12px 30px; border-radius:4px; font-weight:bold; display:inline-block;\">Réinitialiser mon mot de passe</a>"
                + "</div>"
                + "<p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>";

        sendHtmlEmail(toEmail, "Réinitialisation de mot de passe - " + bankName, getHtmlTemplate(titleFr, contentFr, bankName, logoUrl), bankName);
    }

    public void sendTransferEmail(String toEmail, String name, String direction, String amountFormatted, String otherParty, String desc) {
        GlobalConfig config = getActiveConfig();
        String bankName = config.getBankName();
        String logoUrl = config.getLogoUrl();

        String titleFr = direction.equals("OUT") ? "Débit - Confirmation de Virement" : "Crédit - Virement Reçu";
        String subtitleFr = direction.equals("OUT") ? "Votre virement a bien été envoyé." : "Vous avez reçu un nouveau virement.";

        String contentFr = "<p>Bonjour <strong>" + name + "</strong>,</p>"
                + "<p>" + subtitleFr + "</p>"
                + "<div style=\"background-color:#050B14; border:1px solid rgba(66,232,255,0.1); border-radius:4px; padding:20px; margin:20px 0;\">"
                + "  <table style=\"width:100%; font-size:15px; color:#B8C4CC;\">"
                + "    <tr><td style=\"padding:5px 0;\"><strong>Montant :</strong></td><td style=\"text-align:right; color:#30CFEF; font-weight:bold;\">" + amountFormatted + "</td></tr>"
                + "    <tr><td style=\"padding:5px 0;\"><strong>" + (direction.equals("OUT") ? "Destinataire :" : "Expéditeur :") + "</strong></td><td style=\"text-align:right;\">" + otherParty + "</td></tr>"
                + "    <tr><td style=\"padding:5px 0;\"><strong>Motif :</strong></td><td style=\"text-align:right;\">" + (desc != null ? desc : "Transfert") + "</td></tr>"
                + "  </table>"
                + "</div>";

        sendHtmlEmail(toEmail, "Notification de virement - " + bankName, getHtmlTemplate(titleFr, contentFr, bankName, logoUrl), bankName);
    }

    public void sendKycStatusEmail(String toEmail, String clientName, String status, String reason) {
        GlobalConfig config = getActiveConfig();
        String bankName = config.getBankName();
        String logoUrl = config.getLogoUrl();

        String titleFr = status.equals("VALIDATED") ? "Validation de votre dossier KYC - Approuvé" : "Validation de votre dossier KYC - Rejeté";

        String contentFr;
        if (status.equals("VALIDATED")) {
            contentFr = "<p>Bonjour <strong>" + clientName + "</strong>,</p>"
                    + "<p>Bonne nouvelle ! Votre dossier d'identité a été validé avec succès par nos services de conformité.</p>"
                    + "<p>Votre tableau de bord financier et l'ensemble de nos services sont maintenant pleinement accessibles.</p>";
        } else {
            String cleanReason = (reason != null && !reason.trim().isEmpty() ? reason : "Documents non conformes.");
            contentFr = "<p>Bonjour <strong>" + clientName + "</strong>,</p>"
                    + "<p>Votre dossier de conformité n'a pas pu être validé pour la raison suivante :</p>"
                    + "<p style=\"color:#EF4444; font-weight:bold; padding:10px; border-left:4px solid #EF4444; background-color:rgba(239,68,68,0.05);\">" + cleanReason + "</p>"
                    + "<p>Veuillez vous reconnecter à votre espace client pour resoumettre les informations et documents demandés.</p>";
        }
        sendHtmlEmail(toEmail, "Statut de validation de votre compte - " + bankName, getHtmlTemplate(titleFr, contentFr, bankName, logoUrl), bankName);
    }

    public void sendCardOrderedEmail(String toEmail, String clientName, String cardType, String lastFourDigits) {
        GlobalConfig config = getActiveConfig();
        String bankName = config.getBankName();
        String logoUrl = config.getLogoUrl();

        String titleFr = "Confirmation de Commande de Carte";

        String contentFr = "<p>Bonjour <strong>" + clientName + "</strong>,</p>"
                + "<p>Votre commande de carte bancaire <strong>" + cardType.toLowerCase() + "</strong> a été enregistrée avec succès.</p>"
                + "<p>Celle-ci se termine par les chiffres : <strong>•••• " + lastFourDigits + "</strong>.</p>"
                + "<p>" + (cardType.equalsIgnoreCase("VIRTUELLE") ? "Votre carte virtuelle est immédiatement disponible et active dans votre espace client." : "Votre carte physique est en cours d'impression et vous sera expédiée très prochainement.") + "</p>";

        sendHtmlEmail(toEmail, "Commande de carte bancaire enregistrée - " + bankName, getHtmlTemplate(titleFr, contentFr, bankName, logoUrl), bankName);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody, String bankName) {
        executor.submit(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                helper.setFrom("hello@demomailtrap.com", bankName);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(htmlBody, true);
                
                System.out.println("Sending SMTP email via Mailtrap to: " + to);
                mailSender.send(message);
                System.out.println("SMTP email sent successfully via Mailtrap to: " + to);
            } catch (Exception e) {
                System.err.println("Failed to send SMTP email to " + to + ": " + e.getMessage());
                e.printStackTrace();
            }
        });
    }
}
