package com.banquesys.service.external.impl;

import com.banquesys.model.Carte;
import com.banquesys.model.Compte;
import com.banquesys.repository.CarteRepository;
import com.banquesys.service.external.CarteService;
import com.banquesys.service.external.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
public class MockCarteService implements CarteService {

    @Autowired
    private CarteRepository carteRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.banquesys.service.InAppNotificationService inAppNotificationService;

    @Override
    public List<Carte> getCardsByClientId(Long clientId) {
        return carteRepository.findByCompteClientId(clientId);
    }

    @Override
    public Carte orderCard(Compte compte, String type, String stripeColor, String pin) {
        Random random = new Random();
        StringBuilder cardNo = new StringBuilder("4000");
        for (int i = 0; i < 12; i++) {
            cardNo.append(random.nextInt(10));
        }

        LocalDate expiryDate = LocalDate.now().plusYears(5);
        String expiration = expiryDate.format(DateTimeFormatter.ofPattern("MM/yy"));
        String cvv = String.format("%03d", random.nextInt(1000));
        String titulaire = compte.getClient().getPrenom() + " " + compte.getClient().getNom();

        Carte newCard = new Carte(cardNo.toString(), titulaire.toUpperCase(), expiration, cvv, type, stripeColor, compte);
        newCard.setCodePin(pin);

        if ("PREMIUM".equals(compte.getTypeCompte().name())) {
            newCard.setLimitePaiement(new BigDecimal("3000.00"));
            newCard.setLimiteRetrait(new BigDecimal("1000.00"));
        }

        Carte saved = carteRepository.save(newCard);

        String lastFourDigits = saved.getNumeroCarte().substring(saved.getNumeroCarte().length() - 4);
        try {
            String email = compte.getClient().getEmail();
            String name = compte.getClient().getPrenom() + " " + compte.getClient().getNom();
            String emailBody = "<p>Bonjour <strong>" + name + "</strong>,</p>"
                    + "<p>Votre commande de carte <strong>" + type.toLowerCase() + "</strong> a été enregistrée.</p>"
                    + "<p>Fins des chiffres : <strong>•••• " + lastFourDigits + "</strong>.</p>";
            notificationService.sendEmail(email, "Commande de carte enregistrée", emailBody);
        } catch (Exception e) {
            System.err.println("Could not send email for card order: " + e.getMessage());
        }

        try {
            inAppNotificationService.createNotification(
                    compte.getClient(),
                    "Votre commande de carte " + type.toLowerCase() + " a été enregistrée. Chiffres : •••• " + lastFourDigits
            );
        } catch (Exception e) {
            System.err.println("Failed to trigger card order in-app notification: " + e.getMessage());
        }

        return saved;
    }

    @Override
    public Carte toggleBlockCard(Long cardId, Long clientId) {
        Carte carte = carteRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Carte introuvable."));

        if (!carte.getCompte().getClient().getId().equals(clientId)) {
            throw new RuntimeException("Non autorisé.");
        }

        if ("ACTIVE".equals(carte.getStatut())) {
            carte.setStatut("BLOQUEE");
        } else {
            carte.setStatut("ACTIVE");
        }

        Carte saved = carteRepository.save(carte);
        try {
            inAppNotificationService.createNotification(
                    carte.getCompte().getClient(),
                    "Votre carte se terminant par •••• " + carte.getNumeroCarte().substring(carte.getNumeroCarte().length() - 4) + " a été " + ("ACTIVE".equals(carte.getStatut()) ? "débloquée" : "bloquée") + "."
            );
        } catch (Exception e) {
            System.err.println("Failed to trigger card block in-app notification: " + e.getMessage());
        }
        return saved;
    }

    @Override
    public void updatePin(Long cardId, Long clientId, String newPin) {
        Carte carte = carteRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Carte introuvable."));

        if (!carte.getCompte().getClient().getId().equals(clientId)) {
            throw new RuntimeException("Non autorisé.");
        }

        carte.setCodePin(newPin);
        carteRepository.save(carte);
        try {
            inAppNotificationService.createNotification(
                    carte.getCompte().getClient(),
                    "Le code PIN de votre carte se terminant par •••• " + carte.getNumeroCarte().substring(carte.getNumeroCarte().length() - 4) + " a été mis à jour."
            );
        } catch (Exception e) {
            System.err.println("Failed to trigger PIN update in-app notification: " + e.getMessage());
        }
    }

    @Override
    public Carte updateLimits(Long cardId, Long clientId, BigDecimal paymentLimit, BigDecimal withdrawLimit) {
        Carte carte = carteRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Carte introuvable."));

        if (!carte.getCompte().getClient().getId().equals(clientId)) {
            throw new RuntimeException("Non autorisé.");
        }

        carte.setLimitePaiement(paymentLimit);
        carte.setLimiteRetrait(withdrawLimit);
        Carte saved = carteRepository.save(carte);
        try {
            inAppNotificationService.createNotification(
                    carte.getCompte().getClient(),
                    "Les plafonds de paiement et de retrait de votre carte se terminant par •••• " + carte.getNumeroCarte().substring(carte.getNumeroCarte().length() - 4) + " ont été mis à jour."
            );
        } catch (Exception e) {
            System.err.println("Failed to trigger limits update in-app notification: " + e.getMessage());
        }
        return saved;
    }
}
