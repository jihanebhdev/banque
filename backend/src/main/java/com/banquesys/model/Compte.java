package com.banquesys.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
public class Compte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 34)
    private String numeroCompte; // IBAN

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeCompte typeCompte;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Devise devise;

    @Column(nullable = false)
    private BigDecimal solde = BigDecimal.ZERO;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateOuverture = LocalDateTime.now();

    @Column(nullable = false)
    private String statut = "ACTIF";

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    public Compte(String numeroCompte, TypeCompte typeCompte, Devise devise, Client client) {
        this.numeroCompte = numeroCompte;
        this.typeCompte = typeCompte;
        this.devise = devise;
        this.client = client;
    }
}
