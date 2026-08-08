package com.banquesys.controller;

import com.banquesys.dto.response.MessageResponse;
import com.banquesys.model.Compte;
import com.banquesys.repository.CompteRepository;
import com.banquesys.security.UserDetailsImpl;
import com.banquesys.service.OperationService;
import com.banquesys.service.external.FundingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/funding")
public class FundingController {

    @Autowired
    private FundingService fundingService;

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private OperationService operationService;

    @PostMapping("/stripe")
    public ResponseEntity<?> fundAccount(@RequestBody Map<String, Object> request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Compte> comptes = compteRepository.findByClientId(userDetails.getId());
        if (comptes.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Aucun compte bancaire trouvé."));
        }
        Compte compte = comptes.get(0);

        try {
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            String currency = request.getOrDefault("currency", compte.getDevise().name()).toString();
            String paymentMethodId = (String) request.get("paymentMethodId");

            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(new MessageResponse("Le montant doit être supérieur à zéro."));
            }

            boolean paymentSuccess = fundingService.processPayment(amount, currency, paymentMethodId);

            if (paymentSuccess) {
                operationService.effectuerDepot(compte.getNumeroCompte(), amount, "Dépôt par carte via Stripe Sandbox");
                return ResponseEntity.ok(new MessageResponse("Dépôt de " + amount + " " + currency + " effectué avec succès via Stripe Sandbox !"));
            } else {
                return ResponseEntity.badRequest().body(new MessageResponse("La transaction Stripe a été rejetée ou a échoué."));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Erreur de traitement du dépôt : " + e.getMessage()));
        }
    }
}
