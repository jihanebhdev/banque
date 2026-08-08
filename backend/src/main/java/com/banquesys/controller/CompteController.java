package com.banquesys.controller;

import com.banquesys.dto.response.MessageResponse;
import com.banquesys.model.Compte;
import com.banquesys.model.Operation;
import com.banquesys.model.OperationType;
import com.banquesys.repository.CompteRepository;
import com.banquesys.repository.OperationRepository;
import com.banquesys.security.UserDetailsImpl;
import com.banquesys.service.external.FundingService;
import com.banquesys.service.InAppNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/comptes")
public class CompteController {

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private OperationRepository operationRepository;

    @Autowired
    private FundingService fundingService;

    @Autowired
    private InAppNotificationService inAppNotificationService;

    @GetMapping("/check-iban")
    public ResponseEntity<?> checkIban(@RequestParam String iban) {
        java.util.Optional<Compte> compteOpt = compteRepository.findByNumeroCompte(iban);
        if (compteOpt.isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Compte destinataire introuvable."));
        }
        Compte compte = compteOpt.get();
        java.util.Map<String, Object> details = new java.util.HashMap<>();
        details.put("numeroCompte", compte.getNumeroCompte());
        details.put("nom", compte.getClient().getNom());
        details.put("prenom", compte.getClient().getPrenom());
        details.put("devise", compte.getDevise().name());
        return ResponseEntity.ok(details);
    }

    @GetMapping("/my-accounts")
    public ResponseEntity<List<Compte>> getMyAccounts() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        List<Compte> comptes = compteRepository.findByClientId(userDetails.getId());
        return ResponseEntity.ok(comptes);
    }

    @PostMapping("/topup")
    @Transactional
    public ResponseEntity<?> topUp(@RequestBody Map<String, Object> payload) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        List<Compte> comptes = compteRepository.findByClientId(userDetails.getId());
        if (comptes.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Aucun compte bancaire trouvé."));
        }
        Compte compte = comptes.get(0);

        if (!"ACTIF".equals(compte.getStatut())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Votre compte bancaire est inactif ou bloqué."));
        }

        Object montantObj = payload.get("montant");
        if (montantObj == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Le montant est obligatoire."));
        }

        BigDecimal montant;
        try {
            montant = new BigDecimal(montantObj.toString());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Montant invalide."));
        }

        if (montant.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(new MessageResponse("Le montant doit être supérieur à zéro."));
        }

        String numeroCarte = (String) payload.getOrDefault("numeroCarte", "");
        String dateExpiration = (String) payload.getOrDefault("dateExpiration", "");
        String cvv = (String) payload.getOrDefault("cvv", "");

        String lastFour = "xxxx";
        if (numeroCarte != null && numeroCarte.trim().length() >= 4) {
            String trimmed = numeroCarte.trim();
            lastFour = trimmed.substring(trimmed.length() - 4);
        }

        String expMonth = "12";
        String expYear = "2028";
        if (dateExpiration != null && dateExpiration.contains("/")) {
            String[] parts = dateExpiration.split("/");
            if (parts.length == 2) {
                expMonth = parts[0].trim();
                expYear = parts[1].trim();
                if (expYear.length() == 2) {
                    expYear = "20" + expYear;
                }
            }
        }

        // Stripe Sandbox Payment check
        boolean paymentSuccess;
        try {
            paymentSuccess = fundingService.processCardPayment(
                    montant,
                    compte.getDevise().name(),
                    numeroCarte,
                    expMonth,
                    expYear,
                    cvv
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Paiement Stripe échoué : " + e.getMessage()));
        }

        if (!paymentSuccess) {
            return ResponseEntity.badRequest().body(new MessageResponse("Paiement Stripe Sandbox refusé."));
        }

        // Ajouter le montant au solde
        compte.setSolde(compte.getSolde().add(montant));
        compteRepository.save(compte);

        // Créer l'opération de dépôt
        Operation operation = new Operation(
                null,
                compte,
                montant,
                "Alimentation par carte •••• " + lastFour,
                OperationType.DEPOT
        );
        operationRepository.save(operation);

        try {
            inAppNotificationService.createNotification(
                    compte.getClient(),
                    "Alimentation réussie de " + montant + " " + compte.getDevise() + " par carte externe •••• " + lastFour + "."
            );
        } catch (Exception e) {
            System.err.println("Failed to trigger topup in-app notification: " + e.getMessage());
        }

        return ResponseEntity.ok(new MessageResponse("Votre compte a été rechargé de " + montant + " " + compte.getDevise() + " avec succès !"));
    }
}
