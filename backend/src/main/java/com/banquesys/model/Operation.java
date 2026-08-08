package com.banquesys.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
public class Operation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "compte_source_id", nullable = true)
    private Compte compteSource;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "compte_destination_id", nullable = true)
    private Compte compteDestination;

    @Column(nullable = false)
    private BigDecimal montant;

    @Column(nullable = false)
    private LocalDateTime dateOperation = LocalDateTime.now();

    private String description;

    private String categorie;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OperationType type;

    public Operation(Compte compteSource, Compte compteDestination, BigDecimal montant, String description, OperationType type) {
        this.compteSource = compteSource;
        this.compteDestination = compteDestination;
        this.montant = montant;
        this.description = description;
        this.type = type;
        this.dateOperation = LocalDateTime.now();
    }
}
