package com.banquesys.controller;

import com.banquesys.dto.response.MessageResponse;
import com.banquesys.model.*;
import com.banquesys.repository.CompteRepository;
import com.banquesys.repository.OperationRepository;
import com.banquesys.repository.UtilisateurRepository;
import com.banquesys.repository.GlobalConfigRepository;
import com.banquesys.service.AuditService;
import com.banquesys.service.CompteService;
import com.banquesys.service.OpenSignService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/employe")
@PreAuthorize("hasAuthority('ROLE_EMPLOYE') or hasAuthority('ROLE_ADMIN')")
public class EmployeController {

    @Autowired
    private UtilisateurRepository userRepository;

    @Autowired
    private com.banquesys.service.EmailService emailService;

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private com.banquesys.service.InAppNotificationService inAppNotificationService;

    @Autowired
    private OperationRepository operationRepository;

    @Autowired
    private com.banquesys.service.OperationService operationService;

    @Autowired
    private CompteService compteService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    @Autowired
    private GlobalConfigRepository globalConfigRepository;

    @Autowired
    private OpenSignService openSignService;

    @GetMapping("/clients")
    public ResponseEntity<?> getClients() {
        List<Utilisateur> clients = userRepository.findByRole(RoleType.ROLE_CLIENT);
        List<Map<String, Object>> response = new ArrayList<>();

        for (Utilisateur u : clients) {
            if (u instanceof Client) {
                Client c = (Client) u;
                Map<String, Object> map = new HashMap<>();
                map.put("id", c.getId());
                map.put("nom", c.getNom());
                map.put("prenom", c.getPrenom());
                map.put("email", c.getEmail());
                map.put("telephone", c.getTelephone());
                map.put("dateNaissance", c.getDateNaissance());
                map.put("adresse", c.getAdresse());
                map.put("numeroPasseport", c.getNumeroPasseport());
                map.put("dateDelivrance", c.getDateDelivrance());
                map.put("numeroNif", c.getNumeroNif());
                map.put("paysResidenceFiscale", c.getPaysResidenceFiscale());
                map.put("profession", c.getProfession());
                map.put("trancheRevenus", c.getTrancheRevenus());
                map.put("origineFonds", c.getOrigineFonds());
                map.put("kycStatus", c.getKycStatus());
                map.put("statut", c.getStatut());
                map.put("idRectoData", c.getIdRectoData());
                map.put("idVersoData", c.getIdVersoData());
                map.put("proofAddressData", c.getProofAddressData());
                map.put("selfieData", c.getSelfieData());
                
                // OCR Extracted fields
                map.put("extractedNom", c.getExtractedNom());
                map.put("extractedPrenom", c.getExtractedPrenom());
                map.put("extractedNumeroPasseport", c.getExtractedNumeroPasseport());
                map.put("extractedDateNaissance", c.getExtractedDateNaissance());
                map.put("extractedDateDelivrance", c.getExtractedDateDelivrance());
                map.put("extractedAdresse", c.getExtractedAdresse());
                
                map.put("identityDocumentReadable", c.getIdentityDocumentReadable());
                map.put("nameAndSurnameMatching", c.getNameAndSurnameMatching());
                map.put("identityDocumentValid", c.getIdentityDocumentValid());
                map.put("proofOfAddressConform", c.getProofOfAddressConform());
                map.put("noFraudSuspicion", c.getNoFraudSuspicion());
                map.put("amlPepNegative", c.getAmlPepNegative());
                map.put("selfieLivenessMatched", c.getSelfieLivenessMatched());
                map.put("kycConformityScore", c.getKycConformityScore());
                map.put("kycNotes", c.getKycNotes());
                map.put("contratGenere", c.getContratGenere());
                map.put("contratSigne", c.getContratSigne());
                map.put("contratContenu", c.getContratContenu());
                map.put("dateSignature", c.getDateSignature());
                map.put("signatureBase64", c.getSignatureBase64());
                map.put("opensignEnvelopeId", c.getOpensignEnvelopeId());
                map.put("opensignSigningUrl", c.getOpensignSigningUrl());

                List<Compte> accounts = compteRepository.findByClientId(c.getId());
                map.put("comptes", accounts);
                response.add(map);
            }
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/clients/{id}/kyc")
    public ResponseEntity<?> validateKyc(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestBody(required = false) Map<String, Object> payload) {
        Utilisateur user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        if (!(user instanceof Client)) {
            auditService.logError("KYC_ACTION", "Client", id,
                    "Échec action KYC - utilisateur ID #" + id + " n'est pas un client");
            return ResponseEntity.badRequest().body(new MessageResponse("L'utilisateur n'est pas un client"));
        }

        Client client = (Client) user;

        if (payload != null) {
            if (payload.containsKey("identityDocumentReadable")) {
                client.setIdentityDocumentReadable((Boolean) payload.get("identityDocumentReadable"));
            }
            if (payload.containsKey("nameAndSurnameMatching")) {
                client.setNameAndSurnameMatching((Boolean) payload.get("nameAndSurnameMatching"));
            }
            if (payload.containsKey("identityDocumentValid")) {
                client.setIdentityDocumentValid((Boolean) payload.get("identityDocumentValid"));
            }
            if (payload.containsKey("proofOfAddressConform")) {
                client.setProofOfAddressConform((Boolean) payload.get("proofOfAddressConform"));
            }
            if (payload.containsKey("noFraudSuspicion")) {
                client.setNoFraudSuspicion((Boolean) payload.get("noFraudSuspicion"));
            }
            if (payload.containsKey("amlPepNegative")) {
                client.setAmlPepNegative((Boolean) payload.get("amlPepNegative"));
            }
            if (payload.containsKey("selfieLivenessMatched")) {
                client.setSelfieLivenessMatched((Boolean) payload.get("selfieLivenessMatched"));
            }
            if (payload.containsKey("kycNotes")) {
                client.setKycNotes((String) payload.get("kycNotes"));
            }

            int trueCount = 0;
            if (Boolean.TRUE.equals(client.getIdentityDocumentReadable())) trueCount++;
            if (Boolean.TRUE.equals(client.getNameAndSurnameMatching())) trueCount++;
            if (Boolean.TRUE.equals(client.getIdentityDocumentValid())) trueCount++;
            if (Boolean.TRUE.equals(client.getProofOfAddressConform())) trueCount++;
            if (Boolean.TRUE.equals(client.getNoFraudSuspicion())) trueCount++;
            if (Boolean.TRUE.equals(client.getAmlPepNegative())) trueCount++;
            if (Boolean.TRUE.equals(client.getSelfieLivenessMatched())) trueCount++;
            int finalScore = (int) Math.round((trueCount / 7.0) * 100);
            client.setKycConformityScore(finalScore);
        }

        KycStatus oldStatus = client.getKycStatus();
        KycStatus newStatus = KycStatus.valueOf(status.toUpperCase());
        client.setKycStatus(newStatus);
        userRepository.save(client);

        // Audit
        String action = newStatus == KycStatus.VALIDATED ? "KYC_VALIDATE" : "KYC_REJECT";
        auditService.log(action, "Client", id,
                "KYC client " + client.getPrenom() + " " + client.getNom() + " (ID #" + id + "): " +
                        oldStatus + " → " + newStatus,
                newStatus == KycStatus.VALIDATED ? AuditSeverity.SUCCESS : AuditSeverity.WARNING,
                AuditStatus.SUCCESS);

        // Send KYC status email
        try {
            emailService.sendKycStatusEmail(client.getEmail(), client.getPrenom() + " " + client.getNom(), newStatus.name(), "");
        } catch (Exception e) {
            System.err.println("Could not send KYC status email: " + e.getMessage());
        }

        // In-app Notification
        try {
            if (newStatus == KycStatus.VALIDATED) {
                inAppNotificationService.createNotification(client, "Votre dossier KYC a été approuvé. Votre compte et vos cartes sont maintenant pleinement activés.");
            } else if (newStatus == KycStatus.REJECTED) {
                inAppNotificationService.createNotification(client, "Votre dossier KYC a été rejeté par nos conseillers. Veuillez vérifier vos informations et resoumettre vos documents.");
            }
        } catch (Exception e) {
            System.err.println("Failed to trigger KYC in-app notification: " + e.getMessage());
        }

        if (newStatus == KycStatus.VALIDATED) {
            String bankName = "la Banque";
            List<GlobalConfig> configs = globalConfigRepository.findAll();
            if (!configs.isEmpty()) {
                bankName = configs.get(0).getBankName();
            }
            String contrat = "CONTRAT D'OUVERTURE DE COMPTE DE DÉPÔT ET DE SERVICES BANCAIRES\n\n" +
                    "Entre les soussignés :\n" +
                    "La banque " + bankName + ", ci-après dénommée \"la Banque\", d'une part,\n" +
                    "Et :\n" +
                    "M./Mme " + (client.getNom() != null ? client.getNom().toUpperCase() : "") + " " + (client.getPrenom() != null ? client.getPrenom() : "") + ", " +
                    "demeurant au " + (client.getAdresse() != null ? client.getAdresse() : "Non renseignée") + ", né(e) le " + (client.getDateNaissance() != null ? client.getDateNaissance() : "Non renseignée") + ", " +
                    "titulaire du numéro de téléphone " + (client.getTelephone() != null ? client.getTelephone() : "Non renseigné") + ", " +
                    "ci-après dénommé(e) \"le Client\", d'autre part.\n\n" +
                    "Article 1 : Objet du contrat\n" +
                    "Le présent contrat a pour objet de définir les conditions générales d'ouverture, de fonctionnement et de clôture du compte de dépôt du Client auprès de la Banque.\n\n" +
                    "Article 2 : Conditions d'utilisation\n" +
                    "Le compte est destiné à enregistrer les opérations de dépôt, de retrait, de virement et de paiement. Le Client s'engage à maintenir un solde créditeur ou nul.\n\n" +
                    "Article 3 : Signature électronique\n" +
                    "Conformément aux lois en vigueur, l'apposition de la signature électronique par le Client vaut consentement exprès aux termes du présent contrat et a valeur de signature manuscrite.\n\n" +
                    "Fait le " + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " à Casablanca.\n";
            client.setContratContenu(contrat);
            client.setContratGenere(false);
            client.setContratSigne(false);
            userRepository.save(client);

            List<Compte> accounts = compteRepository.findByClientId(client.getId());
            if (accounts.isEmpty()) {
                compteService.creerCompte(client, "STANDARD", "MAD");
            } else {
                for (Compte compte : accounts) {
                    if ("INACTIF".equals(compte.getStatut())) {
                        compte.setStatut("ACTIF");
                        compteRepository.save(compte);
                    }
                }
            }
        }
        return ResponseEntity.ok(new MessageResponse("Statut KYC mis à jour à " + newStatus));
    }

    @PostMapping("/comptes/{id}/toggle")
    public ResponseEntity<?> toggleCompte(@PathVariable Long id) {
        Compte compte = compteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compte non trouvé"));

        String oldStatus = compte.getStatut();
        if ("ACTIF".equals(compte.getStatut())) {
            compte.setStatut("GELE");
        } else {
            compte.setStatut("ACTIF");
        }
        compteRepository.save(compte);

        auditService.logWarning("TOGGLE_ACCOUNT", "Compte", id,
                "Changement statut compte " + compte.getNumeroCompte() + " (ID #" + id + "): " +
                        oldStatus + " → " + compte.getStatut());

        return ResponseEntity.ok(new MessageResponse("Statut du compte mis à jour : " + compte.getStatut()));
    }

    @PostMapping("/clients/{id}/ouvrir-compte")
    public ResponseEntity<?> ouvrirCompte(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Utilisateur user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));
        if (!(user instanceof Client)) {
            return ResponseEntity.badRequest().body(new MessageResponse("L'utilisateur n'est pas un client"));
        }
        Client client = (Client) user;
        String typeCompte = payload.getOrDefault("typeCompte", "STANDARD");
        String devise = payload.getOrDefault("devise", "MAD");
        Compte compte = compteService.creerCompte(client, typeCompte, devise);

        auditService.logSuccess("OPEN_ACCOUNT", "Compte", compte.getId(),
                "Ouverture compte " + typeCompte + " en " + devise + " pour client " +
                        client.getPrenom() + " " + client.getNom() + " (ID #" + id + ")");

        return ResponseEntity.ok(compte);
    }

    @PostMapping("/clients/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Utilisateur user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        String newPassword = payload.get("password");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Le mot de passe est obligatoire."));
        }
        user.setMotDePasse(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // CRITICAL — password reset by staff is a sensitive operation
        auditService.logWarning("RESET_CLIENT_PASSWORD", "Utilisateur", id,
                "Réinitialisation mot de passe par conseiller pour utilisateur: " +
                        user.getPrenom() + " " + user.getNom() + " (ID #" + id + ", " + user.getEmail() + ")");

        return ResponseEntity.ok(new MessageResponse("Mot de passe du client réinitialisé avec succès !"));
    }

    @PostMapping("/clients/{id}/toggle-status")
    public ResponseEntity<?> toggleClientStatus(@PathVariable Long id) {
        Utilisateur user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        String oldStatus = user.getStatut();
        if ("ACTIVE".equals(user.getStatut())) {
            user.setStatut("BLOCKED");
        } else {
            user.setStatut("ACTIVE");
        }
        userRepository.save(user);

        auditService.logWarning("TOGGLE_CLIENT_STATUS", "Utilisateur", id,
                "Changement statut client " + user.getPrenom() + " " + user.getNom() +
                        " (ID #" + id + "): " + oldStatus + " → " + user.getStatut());

        return ResponseEntity.ok(new MessageResponse("Statut de l'utilisateur mis à jour : " + user.getStatut()));
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions() {
        List<Operation> transactions = operationRepository.findAllByOrderByDateOperationDesc();
        return ResponseEntity.ok(transactions);
    }

    @PostMapping("/comptes/{iban}/depot")
    public ResponseEntity<?> depot(@PathVariable String iban, @RequestBody Map<String, Object> payload) {
        try {
            java.math.BigDecimal montant = new java.math.BigDecimal(payload.get("montant").toString());
            String description = (String) payload.get("description");
            Operation op = operationService.effectuerDepot(iban, montant, description);

            auditService.logSuccess("CASH_DEPOSIT", "Compte", op.getId(),
                    "Dépôt espèces de " + montant + " sur compte " + iban +
                            " | description: " + (description != null ? description : "Dépôt en agence"));

            return ResponseEntity.ok(op);
        } catch (Exception e) {
            auditService.logError("CASH_DEPOSIT", "Compte", null,
                    "Échec dépôt espèces sur compte " + iban + ": " + e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/comptes/{iban}/retrait")
    public ResponseEntity<?> retrait(@PathVariable String iban, @RequestBody Map<String, Object> payload) {
        try {
            java.math.BigDecimal montant = new java.math.BigDecimal(payload.get("montant").toString());
            String description = (String) payload.get("description");
            Operation op = operationService.effectuerRetrait(iban, montant, description);

            auditService.logSuccess("CASH_WITHDRAWAL", "Compte", op.getId(),
                    "Retrait espèces de " + montant + " du compte " + iban +
                            " | description: " + (description != null ? description : "Retrait en agence"));

            return ResponseEntity.ok(op);
        } catch (Exception e) {
            auditService.logError("CASH_WITHDRAWAL", "Compte", null,
                    "Échec retrait espèces du compte " + iban + ": " + e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/clients/{id}/send-contract")
    public ResponseEntity<?> sendContract(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Utilisateur user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        if (!(user instanceof Client)) {
            return ResponseEntity.badRequest().body(new MessageResponse("L'utilisateur n'est pas un client"));
        }

        Client client = (Client) user;
        if (client.getKycStatus() != KycStatus.VALIDATED) {
            return ResponseEntity.badRequest().body(new MessageResponse("Le KYC du client doit être validé avant d'envoyer le contrat."));
        }

        String contenu = payload.get("contenu");
        if (contenu == null || contenu.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Le contenu du contrat ne peut pas être vide."));
        }

        client.setContratContenu(contenu);
        client.setContratGenere(true);
        client.setContratSigne(false);
        userRepository.save(client);

        // Audit
        auditService.logSuccess("CONTRACT_PREPARED", "Client", client.getId(),
                "Contrat préparé et envoyé au client: " + client.getPrenom() + " " + client.getNom() + " (ID #" + id + ")");

        // In-app Notification
        try {
            inAppNotificationService.createNotification(client, "Votre contrat d'ouverture de compte est prêt à être signé.");
        } catch (Exception e) {
            System.err.println("Failed to trigger contract notification: " + e.getMessage());
        }

        return ResponseEntity.ok(new MessageResponse("Contrat envoyé au client avec succès !"));
    }
}
