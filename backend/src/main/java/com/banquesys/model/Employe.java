package com.banquesys.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("EMPLOYE")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Employe extends Utilisateur {
    
    public Employe(String nom, String prenom, String email, String motDePasse) {
        this.setNom(nom);
        this.setPrenom(prenom);
        this.setEmail(email);
        this.setMotDePasse(motDePasse);
        this.setRole(RoleType.ROLE_EMPLOYE);
    }
}
