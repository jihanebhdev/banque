package com.banquesys.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String email;
    private String nom;
    private String prenom;
    private String role;
    private String kycStatus;
    
    // Client profile details
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
    private String avatar;
    private boolean epargneIntelligenteActive = false;
    private Boolean contratGenere = false;
    private Boolean contratSigne = false;
    private String contratContenu;
    private String opensignEnvelopeId;
    private String opensignSigningUrl;

    public JwtResponse(String accessToken, Long id, String email, String nom, String prenom, String role, String kycStatus, String avatar) {
        this.token = accessToken;
        this.id = id;
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
        this.role = role;
        this.kycStatus = kycStatus;
        this.avatar = avatar;
    }

    public JwtResponse(String accessToken, Long id, String email, String nom, String prenom, String role, String kycStatus,
                       String telephone, String dateNaissance, String adresse, String numeroPasseport, String dateDelivrance,
                       String numeroNif, String paysResidenceFiscale, String profession, String trancheRevenus, String origineFonds,
                       String avatar) {
        this.token = accessToken;
        this.id = id;
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
        this.role = role;
        this.kycStatus = kycStatus;
        this.telephone = telephone;
        this.dateNaissance = dateNaissance;
        this.adresse = adresse;
        this.numeroPasseport = numeroPasseport;
        this.dateDelivrance = dateDelivrance;
        this.numeroNif = numeroNif;
        this.paysResidenceFiscale = paysResidenceFiscale;
        this.profession = profession;
        this.trancheRevenus = trancheRevenus;
        this.origineFonds = origineFonds;
        this.avatar = avatar;
    }
}
