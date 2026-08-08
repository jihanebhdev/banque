package com.banquesys.controller;

import com.banquesys.dto.request.VirementRequest;
import com.banquesys.dto.response.MessageResponse;
import com.banquesys.model.Compte;
import com.banquesys.model.Operation;
import com.banquesys.repository.CompteRepository;
import com.banquesys.security.UserDetailsImpl;
import com.banquesys.service.AuditService;
import com.banquesys.service.OperationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/operations")
public class OperationController {

    @Autowired
    private OperationService operationService;

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private AuditService auditService;

    @GetMapping("/historique")
    public ResponseEntity<?> getHistorique(@RequestParam(required = false) String iban) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Compte compte = null;
        if (iban != null && !iban.trim().isEmpty()) {
            compte = compteRepository.findByNumeroCompte(iban)
                    .orElseThrow(() -> new RuntimeException("Compte introuvable."));
            
            // Sécurité : s'assurer que le compte appartient bien au client connecté
            if (!compte.getClient().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new MessageResponse("Vous n'êtes pas autorisé à consulter ce compte."));
            }
        } else {
            // Par défaut, récupérer le premier compte du client
            List<Compte> comptes = compteRepository.findByClientId(userDetails.getId());
            if (comptes.isEmpty()) {
                return ResponseEntity.ok(new ArrayList<Operation>());
            }
            compte = comptes.get(0);
        }

        List<Operation> historique = operationService.obtenirHistorique(compte);
        return ResponseEntity.ok(historique);
    }

    @PostMapping("/virement")
    public ResponseEntity<?> effectuerVirement(@RequestBody VirementRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        if (request.getIbanSource() == null || request.getIbanSource().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("IBAN source obligatoire."));
        }
        if (request.getIbanDestination() == null || request.getIbanDestination().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("IBAN destinataire obligatoire."));
        }
        if (request.getMontant() == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Montant obligatoire."));
        }

        Compte compteSource = compteRepository.findByNumeroCompte(request.getIbanSource())
                .orElseThrow(() -> new RuntimeException("Compte source introuvable."));

        // Sécurité : s'assurer que le compte source appartient au client connecté
        if (!compteSource.getClient().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Vous n'êtes pas autorisé à débiter ce compte."));
        }

        if (!"ACTIF".equals(compteSource.getStatut())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Votre compte bancaire est inactif ou bloqué."));
        }

        try {
            Operation operation = operationService.effectuerVirement(
                    request.getIbanSource(),
                    request.getIbanDestination(),
                    request.getMontant(),
                    request.getDescription()
            );
            auditService.logSuccess("WIRE_TRANSFER", "Operation", operation.getId(),
                    "Virement de " + request.getMontant() + " depuis " + request.getIbanSource() +
                            " vers " + request.getIbanDestination() +
                            " | motif: " + (request.getDescription() != null ? request.getDescription() : "N/A"));
            return ResponseEntity.ok(operation);
        } catch (Exception e) {
            auditService.logError("WIRE_TRANSFER", "Operation", null,
                    "Échec virement depuis " + request.getIbanSource() +
                            " vers " + request.getIbanDestination() +
                            " montant: " + request.getMontant() + " | erreur: " + e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
