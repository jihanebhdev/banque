package com.banquesys.controller;

import com.banquesys.service.external.KycService;
import com.banquesys.repository.UtilisateurRepository;
import com.banquesys.model.Client;
import com.banquesys.model.Utilisateur;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/ocr")
public class OcrController {

    @Autowired
    private KycService kycService;

    @Autowired
    private UtilisateurRepository userRepository;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeDocument(@RequestBody Map<String, Object> payload) {
        try {
            String base64Image = (String) payload.get("image");
            Number clientIdNum = (Number) payload.get("clientId");
            Boolean ai = (Boolean) payload.get("ai");
            
            if (ai == null) ai = false;

            if (clientIdNum == null) {
                if (base64Image == null || base64Image.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Aucune image fournie."));
                }

                KycService.KycResult result = kycService.verifyIdentity(base64Image, null);

                if (!result.isSuccess() || 
                    result.getExtractedNom() == null || result.getExtractedNom().trim().isEmpty() ||
                    result.getExtractedPrenom() == null || result.getExtractedPrenom().trim().isEmpty() ||
                    result.getExtractedIdNumber() == null || result.getExtractedIdNumber().trim().isEmpty()) {
                    
                    String errorMsg = (result.getMessage() != null && !result.getMessage().trim().isEmpty()) 
                        ? result.getMessage() 
                        : "L'image téléversée ne semble pas être un document d'identité officiel valide (CNIE ou passeport) ou les informations clés sont illisibles.";
                    
                    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of("error", errorMsg));
                }

                Map<String, String> responseMap = new HashMap<>();
                responseMap.put("nom", result.getExtractedNom());
                responseMap.put("prenom", result.getExtractedPrenom());
                responseMap.put("numeroPasseport", result.getExtractedIdNumber());
                responseMap.put("dateNaissance", result.getExtractedDateNaissance() != null ? result.getExtractedDateNaissance() : "1990-01-01");
                responseMap.put("dateDelivrance", result.getExtractedDateDelivrance() != null ? result.getExtractedDateDelivrance() : "2020-01-01");
                responseMap.put("adresse", result.getExtractedAdresse() != null ? result.getExtractedAdresse() : "Casablanca, Maroc");
                responseMap.put("resume", result.getMessage());

                return ResponseEntity.ok(responseMap);
            }

            Long clientId = clientIdNum.longValue();
            Optional<Utilisateur> userOpt = userRepository.findById(clientId);
            if (userOpt.isEmpty() || !(userOpt.get() instanceof Client)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Client introuvable."));
            }

            Client client = (Client) userOpt.get();

            if (Boolean.TRUE.equals(ai)) {
                System.out.println("[OCR CONTROLLER] Running AI Vision compliance audit for client ID: " + clientId);

                KycService.KycChecklistResult complianceResult = kycService.verifyCompliance(
                    client.getNom(),
                    client.getPrenom(),
                    client.getDateNaissance(),
                    client.getAdresse(),
                    client.getNumeroPasseport(),
                    client.getDateDelivrance(),
                    client.getIdRectoData(),
                    client.getIdVersoData(),
                    client.getProofAddressData(),
                    client.getSelfieData()
                );

                String rectoImg = base64Image != null ? base64Image : client.getIdRectoData();
                KycService.KycResult ocrResult = kycService.verifyIdentity(rectoImg, null);

                client.setIdentityDocumentReadable(complianceResult.isIdentityDocumentReadable());
                client.setNameAndSurnameMatching(complianceResult.isNameAndSurnameMatching());
                client.setIdentityDocumentValid(complianceResult.isIdentityDocumentValid());
                client.setProofOfAddressConform(complianceResult.isProofOfAddressConform());
                client.setNoFraudSuspicion(complianceResult.isNoFraudSuspicion());
                client.setSelfieLivenessMatched(complianceResult.isSelfieLivenessMatched());
                client.setAmlPepNegative(complianceResult.isAmlPepNegative());
                client.setKycConformityScore(complianceResult.getConformityScore());
                client.setKycNotes("Audit IA Vision : " + complianceResult.getMessage());

                if (ocrResult.isSuccess()) {
                    client.setExtractedNom(ocrResult.getExtractedNom());
                    client.setExtractedPrenom(ocrResult.getExtractedPrenom());
                    client.setExtractedNumeroPasseport(ocrResult.getExtractedIdNumber());
                    client.setExtractedDateNaissance(ocrResult.getExtractedDateNaissance());
                    client.setExtractedDateDelivrance(ocrResult.getExtractedDateDelivrance());
                    client.setExtractedAdresse(ocrResult.getExtractedAdresse());
                }

                userRepository.save(client);

                Map<String, Object> responseMap = new HashMap<>();
                responseMap.put("nom", ocrResult.isSuccess() ? ocrResult.getExtractedNom() : client.getExtractedNom());
                responseMap.put("prenom", ocrResult.isSuccess() ? ocrResult.getExtractedPrenom() : client.getExtractedPrenom());
                responseMap.put("numeroPasseport", ocrResult.isSuccess() ? ocrResult.getExtractedIdNumber() : client.getExtractedNumeroPasseport());
                responseMap.put("dateNaissance", ocrResult.isSuccess() ? ocrResult.getExtractedDateNaissance() : client.getExtractedDateNaissance());
                responseMap.put("dateDelivrance", ocrResult.isSuccess() ? ocrResult.getExtractedDateDelivrance() : client.getExtractedDateDelivrance());
                responseMap.put("adresse", ocrResult.isSuccess() ? ocrResult.getExtractedAdresse() : client.getExtractedAdresse());
                responseMap.put("resume", "Audit IA Vision : " + complianceResult.getMessage());

                responseMap.put("identityDocumentReadable", complianceResult.isIdentityDocumentReadable());
                responseMap.put("nameAndSurnameMatching", complianceResult.isNameAndSurnameMatching());
                responseMap.put("identityDocumentValid", complianceResult.isIdentityDocumentValid());
                responseMap.put("proofOfAddressConform", complianceResult.isProofOfAddressConform());
                responseMap.put("noFraudSuspicion", complianceResult.isNoFraudSuspicion());
                responseMap.put("selfieLivenessMatched", complianceResult.isSelfieLivenessMatched());
                responseMap.put("amlPepNegative", complianceResult.isAmlPepNegative());
                responseMap.put("kycConformityScore", complianceResult.getConformityScore());

                return ResponseEntity.ok(responseMap);
            } else {
                Map<String, Object> responseMap = new HashMap<>();
                responseMap.put("nom", client.getExtractedNom());
                responseMap.put("prenom", client.getExtractedPrenom());
                responseMap.put("numeroPasseport", client.getExtractedNumeroPasseport());
                responseMap.put("dateNaissance", client.getExtractedDateNaissance());
                responseMap.put("dateDelivrance", client.getExtractedDateDelivrance());
                responseMap.put("adresse", client.getExtractedAdresse());
                responseMap.put("resume", client.getKycNotes());
                return ResponseEntity.ok(responseMap);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erreur d'analyse: " + e.getMessage()));
        }
    }
}
