package com.banquesys.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@Entity
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fournisseur;

    @Column(nullable = false)
    private BigDecimal montant;

    @Column(nullable = false)
    private String statut = "PENDING"; // PENDING, PAID

    @Column(nullable = false)
    private LocalDate dateEcheance;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    public Facture(String fournisseur, BigDecimal montant, LocalDate dateEcheance, Client client) {
        this.fournisseur = fournisseur;
        this.montant = montant;
        this.dateEcheance = dateEcheance;
        this.client = client;
        this.statut = "PENDING";
    }
}
