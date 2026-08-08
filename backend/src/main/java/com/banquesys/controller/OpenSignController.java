package com.banquesys.controller;

import com.banquesys.dto.response.MessageResponse;
import com.banquesys.model.*;
import com.banquesys.repository.UtilisateurRepository;
import com.banquesys.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth/opensign")
public class OpenSignController {

    @Autowired
    private UtilisateurRepository userRepository;

    @Autowired
    private AuditService auditService;

    /**
     * Webhook triggered by OpenSign (or our mock OpenSign simulator) when a contract is signed.
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody Map<String, Object> payload) {
        String envelopeId = (String) payload.get("envelopeId");
        String event = (String) payload.get("event");
        String signatureBase64 = (String) payload.get("signatureBase64");

        System.out.println("[OPENSIGN WEBHOOK] Received event: " + event + " for envelope: " + envelopeId);

        if (envelopeId == null || envelopeId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("envelopeId est obligatoire."));
        }

        Optional<Utilisateur> userOpt = userRepository.findAll().stream()
                .filter(u -> u instanceof Client && envelopeId.equals(((Client) u).getOpensignEnvelopeId()))
                .findFirst();

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Aucun client trouvé pour l'enveloppe: " + envelopeId));
        }

        Client client = (Client) userOpt.get();

        client.setContratSigne(true);
        client.setDateSignature(LocalDateTime.now().toString());
        if (signatureBase64 != null && !signatureBase64.trim().isEmpty()) {
            client.setSignatureBase64(signatureBase64);
        }
        userRepository.save(client);

        // Audit log
        auditService.logSuccess("CONTRACT_SIGNED_OPENSIGN", "Client", client.getId(),
                "Contrat signé via OpenSign Labs par client: " + client.getPrenom() + " " + client.getNom());

        return ResponseEntity.ok(new MessageResponse("Contrat marqué comme signé avec succès !"));
    }

    /**
     * Retrieve the contract content associated with a given envelope ID.
     */
    @GetMapping("/contract/{envelopeId}")
    public ResponseEntity<?> getContractByEnvelope(@PathVariable String envelopeId) {
        if (envelopeId == null || envelopeId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("envelopeId est obligatoire."));
        }

        Optional<Utilisateur> userOpt = userRepository.findAll().stream()
                .filter(u -> u instanceof Client && envelopeId.equals(((Client) u).getOpensignEnvelopeId()))
                .findFirst();

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Enveloppe introuvable."));
        }

        Client client = (Client) userOpt.get();
        return ResponseEntity.ok(java.util.Collections.singletonMap("contratContenu", client.getContratContenu()));
    }

    /**
     * Endpoint called directly by the client or advisor to manually complete signature
     */
    @PostMapping("/complete")
    public ResponseEntity<?> completeSignature(@RequestBody Map<String, String> payload) {
        String envelopeId = payload.get("envelopeId");
        String signatureBase64 = payload.get("signatureBase64");

        if (envelopeId == null || envelopeId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("envelopeId est obligatoire."));
        }

        Optional<Utilisateur> userOpt = userRepository.findAll().stream()
                .filter(u -> u instanceof Client && envelopeId.equals(((Client) u).getOpensignEnvelopeId()))
                .findFirst();

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Enveloppe introuvable."));
        }

        Client client = (Client) userOpt.get();
        client.setContratSigne(true);
        client.setDateSignature(LocalDateTime.now().toString());
        if (signatureBase64 != null && !signatureBase64.trim().isEmpty()) {
            client.setSignatureBase64(signatureBase64);
        }
        userRepository.save(client);

        // Audit log
        auditService.logSuccess("CONTRACT_SIGNED_OPENSIGN", "Client", client.getId(),
                "Contrat signé via OpenSign Labs par client: " + client.getPrenom() + " " + client.getNom());

        return ResponseEntity.ok(new MessageResponse("Signature complétée !"));
    }
}
