package com.banquesys.dto.request;

import lombok.Data;

@Data
public class KycRequest {
    private String telephone;
    private String dateNaissance;
    private String adresse;
    
    // Regulatory fields
    private String numeroPasseport;
    private String dateDelivrance;
    private String numeroNif;
    private String paysResidenceFiscale;
    private String profession;
    private String trancheRevenus;
    private String origineFonds;
    
    // Pour la création du premier compte lors de l'onboarding
    private String typeCompte; // "STANDARD", "PREMIUM"
    private String devise;     // "EUR", "USD", "MAD"
    
    // OCR Extracted fields
    private String extractedNom;
    private String extractedPrenom;
    private String extractedNumeroPasseport;
    private String extractedDateNaissance;
    private String extractedDateDelivrance;
    private String extractedAdresse;
    
    private String idRectoData;
    private String idVersoData;
    private String proofAddressData;
    private String selfieData;
}
