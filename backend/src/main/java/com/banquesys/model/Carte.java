package com.banquesys.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@Entity
public class Carte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 16)
    private String numeroCarte;

    @Column(nullable = false)
    private String titulaire;

    @Column(nullable = false, length = 5)
    private String dateExpiration;

    @Column(nullable = false, length = 3)
    private String cvv;

    @Column(nullable = false)
    private String statut = "ACTIVE"; // ACTIVE, BLOQUEE

    @Column(nullable = false, length = 4)
    private String codePin = "1234";

    @Column(nullable = false)
    private BigDecimal limitePaiement = new BigDecimal("1000.00");

    @Column(nullable = false)
    private BigDecimal limiteRetrait = new BigDecimal("500.00");

    @Column(nullable = false)
    private String type = "VIRTUELLE"; // VIRTUELLE, PHYSIQUE

    @Column(nullable = false)
    private String stripeColor = "PINK"; // PINK, DARK

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "compte_id", nullable = false)
    private Compte compte;

    public Carte(String numeroCarte, String titulaire, String dateExpiration, String cvv, String type, String stripeColor, Compte compte) {
        this.numeroCarte = numeroCarte;
        this.titulaire = titulaire;
        this.dateExpiration = dateExpiration;
        this.cvv = cvv;
        this.type = type;
        this.stripeColor = stripeColor;
        this.compte = compte;
    }
}
