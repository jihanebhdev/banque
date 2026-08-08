package com.banquesys.controller;

import com.banquesys.dto.request.KycRequest;
import com.banquesys.dto.response.MessageResponse;
import com.banquesys.model.*;
import com.banquesys.repository.UtilisateurRepository;
import com.banquesys.repository.CompteRepository;
import com.banquesys.security.UserDetailsImpl;
import com.banquesys.service.CompteService;
import com.banquesys.service.external.KycService;
import com.banquesys.service.external.AmlPepService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/kyc")
public class KycController {

    @Autowired
    private UtilisateurRepository userRepository;

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private CompteService compteService;

    @Autowired
    private KycService kycService;

    @Autowired
    private AmlPepService amlPepService;

    @PostMapping("/submit")
    public ResponseEntity<?> submitKyc(@RequestBody KycRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Utilisateur user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(user instanceof Client)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Seuls les clients peuvent soumettre un KYC."));
        }

        Client client = (Client) user;
        
        // Mettre à jour les informations du client
        client.setTelephone(request.getTelephone());
        client.setDateNaissance(request.getDateNaissance());
        client.setAdresse(request.getAdresse());
        client.setNumeroPasseport(request.getNumeroPasseport());
        client.setDateDelivrance(request.getDateDelivrance());
        client.setNumeroNif(request.getNumeroNif());
        client.setPaysResidenceFiscale(request.getPaysResidenceFiscale());
        client.setProfession(request.getProfession());
        client.setTrancheRevenus(request.getTrancheRevenus());
        client.setOrigineFonds(request.getOrigineFonds());
        
        // Map document data strings
        client.setIdRectoData(request.getIdRectoData());
        client.setIdVersoData(request.getIdVersoData());
        client.setProofAddressData(request.getProofAddressData());
        client.setSelfieData(request.getSelfieData());
        
        // Map OCR extracted fields
        client.setExtractedNom(request.getExtractedNom());
        client.setExtractedPrenom(request.getExtractedPrenom());
        client.setExtractedNumeroPasseport(request.getExtractedNumeroPasseport());
        client.setExtractedDateNaissance(request.getExtractedDateNaissance());
        client.setExtractedDateDelivrance(request.getExtractedDateDelivrance());
        client.setExtractedAdresse(request.getExtractedAdresse());
        
        // AI Compliance screening
        KycService.KycChecklistResult complianceResult = kycService.verifyCompliance(
            client.getNom(),
            client.getPrenom(),
            request.getDateNaissance(),
            request.getAdresse(),
            request.getNumeroPasseport(),
            request.getDateDelivrance(),
            request.getIdRectoData(),
            request.getIdVersoData(),
            request.getProofAddressData(),
            request.getSelfieData()
        );

        // Local PEP Check list as a safety net
        boolean isSuspicious = amlPepService.isSanctionedOrPep(client.getNom(), client.getPrenom(), request.getNumeroPasseport());

        // Save AI screening results and score to database
        client.setIdentityDocumentReadable(complianceResult.isIdentityDocumentReadable());
        client.setNameAndSurnameMatching(complianceResult.isNameAndSurnameMatching());
        client.setIdentityDocumentValid(complianceResult.isIdentityDocumentValid());
        client.setProofOfAddressConform(complianceResult.isProofOfAddressConform());
        client.setNoFraudSuspicion(complianceResult.isNoFraudSuspicion());
        client.setSelfieLivenessMatched(complianceResult.isSelfieLivenessMatched());
        
        boolean amlPepNeg = complianceResult.isAmlPepNegative() && !isSuspicious;
        client.setAmlPepNegative(amlPepNeg);
        
        // Recalculate score based on flags (combining AI & local PEP list check)
        int trueCount = 0;
        if (complianceResult.isIdentityDocumentReadable()) trueCount++;
        if (complianceResult.isNameAndSurnameMatching()) trueCount++;
        if (complianceResult.isIdentityDocumentValid()) trueCount++;
        if (complianceResult.isProofOfAddressConform()) trueCount++;
        if (complianceResult.isNoFraudSuspicion()) trueCount++;
        if (complianceResult.isSelfieLivenessMatched()) trueCount++;
        if (amlPepNeg) trueCount++;
        int finalScore = (int) Math.round((trueCount / 7.0) * 100);
        client.setKycConformityScore(finalScore);
        
        // Save explanation as KYC notes initially
        client.setKycNotes("Analyse automatique : " + complianceResult.getMessage());

        if (!amlPepNeg) {
            client.setKycStatus(KycStatus.REJECTED);
            userRepository.save(client);
            return ResponseEntity.badRequest().body(new MessageResponse("Erreur de conformité AML : Échec de la vérification de sécurité."));
        }
        
        // Mettre le statut à SUBMITTED pour validation manuelle par l'employé
        client.setKycStatus(KycStatus.SUBMITTED);
        userRepository.save(client);

        // Créer le compte bancaire choisi avec le statut INACTIF
        Compte compte = compteService.creerCompte(client, request.getTypeCompte(), request.getDevise());
        compte.setStatut("INACTIF");
        compteRepository.save(compte);

        return ResponseEntity.ok(new MessageResponse("KYC soumis avec succès, en attente de validation par nos conseillers !"));
    }
}
