package com.banquesys.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("CLIENT")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Client extends Utilisateur {
    
    private String telephone;
    private String dateNaissance;
    private String adresse;
    private Boolean epargneIntelligenteActive = false;

    // Contract fields
    private Boolean contratGenere = false;
    private Boolean contratSigne = false;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String contratContenu;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String signatureBase64;

    private String dateSignature;

    private String opensignEnvelopeId;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String opensignSigningUrl;

    public boolean isEpargneIntelligenteActive() {
        return epargneIntelligenteActive != null && epargneIntelligenteActive;
    }
    
    // Phase 2 Regulatory fields
    private String numeroPasseport;
    private String dateDelivrance;
    private String numeroNif; // Tax ID / TIN
    private String paysResidenceFiscale;
    private String profession;
    private String trancheRevenus;
    private String origineFonds;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String idRectoData;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String idVersoData;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String proofAddressData;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String selfieData;

    // OCR Extracted fields
    private String extractedNom;
    private String extractedPrenom;
    private String extractedNumeroPasseport;
    private String extractedDateNaissance;
    private String extractedDateDelivrance;
    private String extractedAdresse;

    private Boolean identityDocumentReadable = false;
    private Boolean nameAndSurnameMatching = false;
    private Boolean identityDocumentValid = false;
    private Boolean proofOfAddressConform = false;
    private Boolean noFraudSuspicion = false;
    private Boolean amlPepNegative = false;
    private Boolean selfieLivenessMatched = false;
    private Integer kycConformityScore = 0;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String kycNotes;

    public Client(String nom, String prenom, String email, String motDePasse) {
        this.setNom(nom);
        this.setPrenom(prenom);
        this.setEmail(email);
        this.setMotDePasse(motDePasse);
        this.setRole(RoleType.ROLE_CLIENT);
    }
}
