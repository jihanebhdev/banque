package com.banquesys.service.external.impl;

import com.banquesys.model.Compte;
import com.banquesys.model.Facture;
import com.banquesys.model.Operation;
import com.banquesys.model.OperationType;
import com.banquesys.repository.CompteRepository;
import com.banquesys.repository.FactureRepository;
import com.banquesys.repository.OperationRepository;
import com.banquesys.service.external.FactureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class MockFactureService implements FactureService {

    @Autowired
    private FactureRepository factureRepository;

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private OperationRepository operationRepository;

    @Autowired
    private com.banquesys.service.InAppNotificationService inAppNotificationService;

    @Override
    public List<Facture> getFacturesByClientId(Long clientId) {
        return factureRepository.findByClientId(clientId);
    }

    @Override
    @Transactional
    public Facture payFacture(Long factureId, Long clientId) {
        Facture facture = factureRepository.findById(factureId)
                .orElseThrow(() -> new RuntimeException("Facture introuvable."));

        if (!facture.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Non autorisé à payer cette facture.");
        }

        if ("PAID".equals(facture.getStatut())) {
            throw new RuntimeException("Cette facture a déjà été réglée.");
        }

        List<Compte> comptes = compteRepository.findByClientId(clientId);
        if (comptes.isEmpty()) {
            throw new RuntimeException("Aucun compte actif trouvé.");
        }
        Compte compte = comptes.get(0);

        if (!"ACTIF".equals(compte.getStatut())) {
            throw new RuntimeException("Votre compte bancaire est inactif ou bloqué.");
        }

        if (compte.getSolde().compareTo(facture.getMontant()) < 0) {
            throw new RuntimeException("Solde insuffisant.");
        }

        // Debit account
        compte.setSolde(compte.getSolde().subtract(facture.getMontant()));
        compteRepository.save(compte);

        // Update invoice
        facture.setStatut("PAID");
        Facture paidFacture = factureRepository.save(facture);

        // Save transaction
        Operation operation = new Operation(
                compte,
                compte,
                facture.getMontant(),
                "Règlement Facture " + facture.getFournisseur(),
                OperationType.RETRAIT
        );
        operationRepository.save(operation);

        // Create in-app notification
        try {
            inAppNotificationService.createNotification(
                    facture.getClient(),
                    "Paiement de la facture " + facture.getFournisseur() + " d'un montant de " + facture.getMontant() + " " + compte.getDevise() + " effectué avec succès."
            );
        } catch (Exception e) {
            System.err.println("Failed to trigger invoice payment in-app notification: " + e.getMessage());
        }

        return paidFacture;
    }
}
