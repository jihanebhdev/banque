package com.banquesys.service;

import com.banquesys.model.*;
import com.banquesys.repository.CompteRepository;
import com.banquesys.repository.OperationRepository;
import com.banquesys.service.external.CentralBankReportingService;
import com.banquesys.service.external.ExchangeRateService;
import com.banquesys.service.external.ExpenseCategorizerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class OperationService {

    @Autowired
    private OperationRepository operationRepository;

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ExchangeRateService exchangeRateService;

    @Autowired
    private ExpenseCategorizerService expenseCategorizerService;

    @Autowired
    private CentralBankReportingService centralBankReportingService;

    @Autowired
    private InAppNotificationService inAppNotificationService;

    public List<Operation> obtenirHistorique(Compte compte) {
        return operationRepository.findByCompteSourceOrCompteDestinationOrderByDateOperationDesc(compte, compte);
    }

    @Transactional
    public Operation effectuerVirement(String ibanSource, String ibanDestination, BigDecimal montant, String description) {
        if (montant.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Le montant du virement doit être supérieur à zéro.");
        }

        Compte compteSource = compteRepository.findByNumeroCompte(ibanSource)
                .orElseThrow(() -> new RuntimeException("Compte émetteur introuvable."));

        Compte compteDestination = compteRepository.findByNumeroCompte(ibanDestination)
                .orElseThrow(() -> new RuntimeException("Le compte bénéficiaire avec l'IBAN indiqué est introuvable."));

        if (!compteSource.getStatut().equals("ACTIF")) {
            throw new RuntimeException("Le compte émetteur est inactif ou bloqué.");
        }

        if (!compteDestination.getStatut().equals("ACTIF")) {
            throw new RuntimeException("Le compte bénéficiaire est inactif ou bloqué.");
        }

        if (compteSource.getNumeroCompte().equals(compteDestination.getNumeroCompte())) {
            throw new RuntimeException("Impossible d'effectuer un virement vers le même compte.");
        }

        // Vérification du solde suffisant
        if (compteSource.getSolde().compareTo(montant) < 0) {
            throw new RuntimeException("Solde insuffisant pour effectuer cette opération.");
        }

        // Conversion de devises si nécessaire (uniquement si compte destination interne)
        BigDecimal montantDest = montant;
        if (compteSource.getDevise() != compteDestination.getDevise()) {
            montantDest = convertir(montant, compteSource.getDevise(), compteDestination.getDevise());
        }

        // Débit Source
        compteSource.setSolde(compteSource.getSolde().subtract(montant));
        compteRepository.save(compteSource);
        
        // Crédit Destination
        compteDestination.setSolde(compteDestination.getSolde().add(montantDest));
        compteRepository.save(compteDestination);

        // In-app Notifications
        try {
            inAppNotificationService.createNotification(
                    compteSource.getClient(),
                    "Virement émis de " + montant + " " + compteSource.getDevise() + " vers " 
                    + compteDestination.getClient().getPrenom() + " " + compteDestination.getClient().getNom() 
                    + " (" + compteDestination.getNumeroCompte() + ")."
            );
            inAppNotificationService.createNotification(
                    compteDestination.getClient(),
                    "Virement reçu de " + montantDest + " " + compteDestination.getDevise() + " de la part de " 
                    + compteSource.getClient().getPrenom() + " " + compteSource.getClient().getNom() 
                    + " (" + compteSource.getNumeroCompte() + ")."
            );
        } catch (Exception e) {
            System.err.println("Failed to trigger transfer in-app notifications: " + e.getMessage());
        }

        // Enregistrer l'opération
        Operation operation = new Operation(compteSource, compteDestination, montant, description != null ? description : "Virement interne", OperationType.VIREMENT);
        
        String cat = expenseCategorizerService.categorize(operation.getDescription());
        operation.setCategorie(cat);

        Operation savedOp = operationRepository.save(operation);

        try {
            centralBankReportingService.reportTransaction(savedOp);
        } catch (Exception e) {
            System.err.println("Regulatory report failed: " + e.getMessage());
        }

        try {
            declencherEpargneIntelligente(compteSource, montant);
        } catch (Exception e) {
            System.err.println("Savings round-up failed: " + e.getMessage());
        }

        // Envoyer les e-mails de notification de virement
        try {
            // E-mail pour l'émetteur (debit)
            String emailSource = compteSource.getClient().getEmail();
            String nameSource = compteSource.getClient().getPrenom() + " " + compteSource.getClient().getNom();
            String amountFormattedSource = montant + " " + compteSource.getDevise();
            String otherPartySource = compteDestination.getClient() != null 
                    ? (compteDestination.getClient().getPrenom() + " " + compteDestination.getClient().getNom() + " (" + compteDestination.getNumeroCompte() + ")")
                    : ibanDestination;
            emailService.sendTransferEmail(emailSource, nameSource, "OUT", amountFormattedSource, otherPartySource, description);

            // E-mail pour le destinataire (credit)
            if (compteDestination.getClient() != null) {
                String emailDest = compteDestination.getClient().getEmail();
                String nameDest = compteDestination.getClient().getPrenom() + " " + compteDestination.getClient().getNom();
                String amountFormattedDest = montantDest + " " + compteDestination.getDevise();
                String otherPartyDest = nameSource + " (" + compteSource.getNumeroCompte() + ")";
                emailService.sendTransferEmail(emailDest, nameDest, "IN", amountFormattedDest, otherPartyDest, description);
            }
        } catch (Exception e) {
            System.err.println("Could not send transfer emails: " + e.getMessage());
        }

        return savedOp;
    }

    private void declencherEpargneIntelligente(Compte compteSource, BigDecimal montant) {
        Client client = compteSource.getClient();
        if (client != null && client.isEpargneIntelligenteActive()) {
            BigDecimal arrondi = montant.setScale(0, RoundingMode.CEILING);
            BigDecimal diff = arrondi.subtract(montant);

            if (diff.compareTo(BigDecimal.ZERO) > 0) {
                List<Compte> comptes = compteRepository.findByClientId(client.getId());
                Compte compteEpargne = null;
                for (Compte c : comptes) {
                    if (c.getTypeCompte() == TypeCompte.EPARGNE && "ACTIF".equals(c.getStatut())) {
                        compteEpargne = c;
                        break;
                    }
                }

                if (compteEpargne != null && compteSource.getSolde().compareTo(diff) >= 0) {
                    compteSource.setSolde(compteSource.getSolde().subtract(diff));
                    compteEpargne.setSolde(compteEpargne.getSolde().add(diff));

                    compteRepository.save(compteSource);
                    compteRepository.save(compteEpargne);

                    Operation opEpargne = new Operation(
                            compteSource,
                            compteEpargne,
                            diff,
                            "Épargne Intelligente - Arrondi",
                            OperationType.VIREMENT
                    );
                    opEpargne.setCategorie("Épargne");
                    operationRepository.save(opEpargne);
                    System.out.println("[SAVINGS ROUND-UP] Transferred " + diff + " " + compteSource.getDevise() + " to savings account " + compteEpargne.getNumeroCompte());
                }
            }
        }
    }

    private BigDecimal convertir(BigDecimal montant, Devise source, Devise destination) {
        BigDecimal taux = exchangeRateService.getRate(source, destination);
        return montant.multiply(taux).setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional
    public Operation effectuerDepot(String iban, BigDecimal montant, String description) {
        if (montant.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Le montant du dépôt doit être supérieur à zéro.");
        }

        Compte compte = compteRepository.findByNumeroCompte(iban)
                .orElseThrow(() -> new RuntimeException("Compte introuvable."));

        if (!compte.getStatut().equals("ACTIF")) {
            throw new RuntimeException("Le compte est inactif ou bloqué.");
        }

        compte.setSolde(compte.getSolde().add(montant));
        compteRepository.save(compte);

        Operation operation = new Operation(null, compte, montant, description != null ? description : "Dépôt en agence", OperationType.DEPOT);
        operation.setCategorie(expenseCategorizerService.categorize(operation.getDescription()));
        
        Operation saved = operationRepository.save(operation);
        try {
            inAppNotificationService.createNotification(
                    compte.getClient(),
                    "Dépôt de " + montant + " " + compte.getDevise() + " effectué sur votre compte " + compte.getNumeroCompte() + " (" + (description != null ? description : "Dépôt en agence") + ")."
            );
        } catch (Exception e) {
            System.err.println("Failed to trigger deposit in-app notification: " + e.getMessage());
        }
        try {
            centralBankReportingService.reportTransaction(saved);
        } catch (Exception e) {
            System.err.println("Regulatory report failed: " + e.getMessage());
        }
        return saved;
    }

    @Transactional
    public Operation effectuerRetrait(String iban, BigDecimal montant, String description) {
        if (montant.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Le montant du retrait doit être supérieur à zéro.");
        }

        Compte compte = compteRepository.findByNumeroCompte(iban)
                .orElseThrow(() -> new RuntimeException("Compte introuvable."));

        if (!compte.getStatut().equals("ACTIF")) {
            throw new RuntimeException("Le compte est inactif ou bloqué.");
        }

        if (compte.getSolde().compareTo(montant) < 0) {
            throw new RuntimeException("Solde insuffisant pour ce retrait.");
        }

        compte.setSolde(compte.getSolde().subtract(montant));
        compteRepository.save(compte);

        Operation operation = new Operation(compte, null, montant, description != null ? description : "Retrait en agence", OperationType.RETRAIT);
        operation.setCategorie(expenseCategorizerService.categorize(operation.getDescription()));
        
        Operation saved = operationRepository.save(operation);
        try {
            inAppNotificationService.createNotification(
                    compte.getClient(),
                    "Retrait de " + montant + " " + compte.getDevise() + " effectué depuis votre compte " + compte.getNumeroCompte() + " (" + (description != null ? description : "Retrait en agence") + ")."
            );
        } catch (Exception e) {
            System.err.println("Failed to trigger withdrawal in-app notification: " + e.getMessage());
        }
        try {
            centralBankReportingService.reportTransaction(saved);
        } catch (Exception e) {
            System.err.println("Regulatory report failed: " + e.getMessage());
        }

        try {
            declencherEpargneIntelligente(compte, montant);
        } catch (Exception e) {
            System.err.println("Savings round-up failed: " + e.getMessage());
        }

        return saved;
    }
}
