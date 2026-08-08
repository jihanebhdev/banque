package com.banquesys.controller;

import com.banquesys.dto.response.MessageResponse;
import com.banquesys.model.*;
import com.banquesys.security.UserDetailsImpl;
import com.banquesys.service.external.FactureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/factures")
public class FactureController {

    @Autowired
    private FactureService factureService;

    @Autowired
    private com.banquesys.repository.UtilisateurRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getFactures() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Utilisateur user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(user instanceof Client)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Seuls les clients ont des factures."));
        }

        Client client = (Client) user;
        List<Facture> list = factureService.getFacturesByClientId(client.getId());

        return ResponseEntity.ok(list);
    }

    @PostMapping("/{id}/payer")
    public ResponseEntity<?> payerFacture(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        try {
            Facture facture = factureService.payFacture(id, userDetails.getId());
            return ResponseEntity.ok(new MessageResponse("La facture a été réglée avec succès !"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Erreur lors du paiement : " + e.getMessage()));
        }
    }
}
