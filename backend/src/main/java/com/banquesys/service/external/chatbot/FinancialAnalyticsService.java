package com.banquesys.service.external.chatbot;

import com.banquesys.model.Compte;
import com.banquesys.model.Operation;
import com.banquesys.repository.CompteRepository;
import com.banquesys.repository.OperationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class FinancialAnalyticsService {

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private OperationRepository operationRepository;

    public static class FinancialSummary {
        public BigDecimal totalAssets = BigDecimal.ZERO;
        public BigDecimal monthlyIncome = BigDecimal.ZERO;
        public BigDecimal monthlyExpenses = BigDecimal.ZERO;
        public Map<String, BigDecimal> categoryExpenses = new HashMap<>();
        public List<String> excessiveSpendingAlerts = new ArrayList<>();
        public List<String> savingsAdvice = new ArrayList<>();
        public String currency = "MAD";
    }

    public FinancialSummary computeSummary(Long clientId) {
        FinancialSummary summary = new FinancialSummary();
        List<Compte> comptes = compteRepository.findByClientId(clientId);
        if (comptes.isEmpty()) {
            return summary;
        }

        // Default currency from first account
        summary.currency = comptes.get(0).getDevise().toString();

        // Calculate total assets across all accounts (patrimoine)
        for (Compte compte : comptes) {
            if ("ACTIF".equalsIgnoreCase(compte.getStatut())) {
                summary.totalAssets = summary.totalAssets.add(compte.getSolde());
            }
        }

        // Fetch operations in last 30 days
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        
        for (Compte compte : comptes) {
            List<Operation> operations = operationRepository.findByCompteSourceOrCompteDestinationOrderByDateOperationDesc(compte, compte);
            
            for (Operation op : operations) {
                // Filter last 30 days
                if (op.getDateOperation().isAfter(thirtyDaysAgo)) {
                    BigDecimal amt = op.getMontant();
                    
                    // Determine if it is debit or credit relative to this account
                    boolean isDebit = op.getCompteSource() != null && op.getCompteSource().getId().equals(compte.getId());
                    boolean isCredit = op.getCompteDestination() != null && op.getCompteDestination().getId().equals(compte.getId());

                    if (isDebit) {
                        summary.monthlyExpenses = summary.monthlyExpenses.add(amt);
                        // Group by category
                        String cat = op.getCategorie();
                        if (cat == null || cat.trim().isEmpty()) {
                            cat = "Autre";
                        }
                        summary.categoryExpenses.put(cat, summary.categoryExpenses.getOrDefault(cat, BigDecimal.ZERO).add(amt));
                        
                        // Heuristic: Check for large single transaction (excessive spending warning)
                        if (amt.compareTo(new BigDecimal("5000")) > 0) {
                            summary.excessiveSpendingAlerts.add("Dépense importante détectée : " + amt + " " + summary.currency + " pour '" + op.getDescription() + "' le " + op.getDateOperation().toLocalDate());
                        }
                    } else if (isCredit) {
                        summary.monthlyIncome = summary.monthlyIncome.add(amt);
                    }
                }
            }
        }

        // Excessive spending alerts by category
        // If a category exceeds 40% of total expenses, flag it
        if (summary.monthlyExpenses.compareTo(BigDecimal.ZERO) > 0) {
            for (Map.Entry<String, BigDecimal> entry : summary.categoryExpenses.entrySet()) {
                BigDecimal pct = entry.getValue().multiply(new BigDecimal("100")).divide(summary.monthlyExpenses, 2, RoundingMode.HALF_UP);
                if (pct.compareTo(new BigDecimal("40")) > 0 && !entry.getKey().equalsIgnoreCase("Logement") && !entry.getKey().equalsIgnoreCase("Epargne")) {
                    summary.excessiveSpendingAlerts.add("Dépense excessive dans la catégorie '" + entry.getKey() + "' (" + pct + "% des dépenses totales).");
                }
            }
        }

        // Generate personalized savings advice based on local analysis
        if (summary.monthlyIncome.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal savings = summary.monthlyIncome.subtract(summary.monthlyExpenses);
            BigDecimal savingsRate = savings.multiply(new BigDecimal("100")).divide(summary.monthlyIncome, 2, RoundingMode.HALF_UP);
            
            if (savingsRate.compareTo(new BigDecimal("20")) >= 0) {
                summary.savingsAdvice.add("Excellent ! Votre taux d'épargne est de " + savingsRate + "%. Vous devriez envisager de placer cet excédent sur un compte d'épargne bloqué.");
            } else if (savingsRate.compareTo(BigDecimal.ZERO) > 0) {
                summary.savingsAdvice.add("Votre taux d'épargne actuel est de " + savingsRate + "%. Pour atteindre l'objectif recommandé de 20%, essayez de réduire les dépenses discrétionnaires.");
            } else {
                summary.savingsAdvice.add("Alerte : Vos dépenses dépassent vos revenus ce mois-ci (déficit de " + savings.abs() + " " + summary.currency + "). Créez un budget strict pour inverser la tendance.");
            }
        } else {
            summary.savingsAdvice.add("Aucun revenu enregistré ce mois-ci. Alimentez votre compte pour démarrer une stratégie d'épargne.");
        }

        return summary;
    }

    public String generateCompactPrompt(FinancialSummary summary, Map<String, String> replacements, AnonymizationService anonymizer) {
        StringBuilder sb = new StringBuilder();
        sb.append("RÉSUMÉ FINANCIER DU CLIENT (Anonymisé pour la confidentialité) :\n");
        sb.append("- Patrimoine Total (Actifs): ").append(summary.totalAssets).append(" ").append(summary.currency).append("\n");
        sb.append("- Revenus (Derniers 30j): ").append(summary.monthlyIncome).append(" ").append(summary.currency).append("\n");
        sb.append("- Dépenses (Derniers 30j): ").append(summary.monthlyExpenses).append(" ").append(summary.currency).append("\n");
        
        sb.append("- Dépenses par catégorie :\n");
        if (summary.categoryExpenses.isEmpty()) {
            sb.append("  Aucune dépense enregistrée.\n");
        } else {
            for (Map.Entry<String, BigDecimal> entry : summary.categoryExpenses.entrySet()) {
                sb.append("  * ").append(entry.getKey()).append(" : ").append(entry.getValue()).append(" ").append(summary.currency).append("\n");
            }
        }

        if (!summary.excessiveSpendingAlerts.isEmpty()) {
            sb.append("- Alertes sur les dépenses excessives :\n");
            for (String alert : summary.excessiveSpendingAlerts) {
                sb.append("  ⚠️ ").append(anonymizer.anonymizeText(alert, replacements)).append("\n");
            }
        }

        sb.append("- Suggestions d'épargne issues de nos algorithmes locaux :\n");
        for (String advice : summary.savingsAdvice) {
            sb.append("  💡 ").append(advice).append("\n");
        }
        
        return sb.toString();
    }
}
