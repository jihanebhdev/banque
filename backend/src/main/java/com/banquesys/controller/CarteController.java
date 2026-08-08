package com.banquesys.controller;

import com.banquesys.model.Carte;
import com.banquesys.model.Compte;
import com.banquesys.repository.CompteRepository;
import com.banquesys.security.UserDetailsImpl;
import com.banquesys.service.external.CarteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/cartes")
public class CarteController {

    @Autowired
    private CarteService carteService;

    @Autowired
    private CompteRepository compteRepository;

    @GetMapping
    public ResponseEntity<?> getMyCards() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Carte> cartes = carteService.getCardsByClientId(userDetails.getId());
        return ResponseEntity.ok(cartes);
    }

    @PostMapping
    public ResponseEntity<?> orderCard(@RequestBody Map<String, String> request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Compte> comptes = compteRepository.findByClientId(userDetails.getId());

        if (comptes.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erreur: Aucun compte actif trouvé pour ce client."));
        }

        Compte primaryCompte = comptes.get(0);

        String type = request.getOrDefault("type", "VIRTUELLE");
        String stripeColor = request.getOrDefault("stripeColor", "PINK");
        String pin = request.getOrDefault("pin", "1234");

        if (pin.length() != 4 || !pin.matches("\\d+")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le code PIN doit être composé de 4 chiffres."));
        }

        Carte saved = carteService.orderCard(primaryCompte, type, stripeColor, pin);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<?> toggleBlockCard(@PathVariable Long id) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        try {
            Carte carte = carteService.toggleBlockCard(id, userDetails.getId());
            return ResponseEntity.ok(carte);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/pin")
    public ResponseEntity<?> updatePin(@PathVariable Long id, @RequestBody Map<String, String> request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String newPin = request.get("pin");
        if (newPin == null || newPin.length() != 4 || !newPin.matches("\\d+")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le code PIN doit être composé de 4 chiffres."));
        }

        try {
            carteService.updatePin(id, userDetails.getId(), newPin);
            return ResponseEntity.ok(Map.of("message", "Code PIN mis à jour avec succès."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/limits")
    public ResponseEntity<?> updateLimits(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        UserDetailsImpl userDetails = (SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof UserDetailsImpl) 
            ? (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal() : null;

        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Non authentifié."));
        }

        try {
            BigDecimal limitPaiement = new BigDecimal(request.get("limitePaiement").toString());
            BigDecimal limitRetrait = new BigDecimal(request.get("limiteRetrait").toString());

            if (limitPaiement.compareTo(BigDecimal.ZERO) < 0 || limitRetrait.compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Les limites doivent être positives."));
            }

            Carte carte = carteService.updateLimits(id, userDetails.getId(), limitPaiement, limitRetrait);
            return ResponseEntity.ok(carte);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Données invalides : " + e.getMessage()));
        }
    }
}
