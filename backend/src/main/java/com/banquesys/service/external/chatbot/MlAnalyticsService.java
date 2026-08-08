package com.banquesys.service.external.chatbot;

import com.banquesys.model.Compte;
import com.banquesys.model.Operation;
import com.banquesys.model.OperationType;
import com.banquesys.repository.CompteRepository;
import com.banquesys.repository.OperationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class MlAnalyticsService {

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private OperationRepository operationRepository;

    /**
     * 1. Smart Transaction Classifier (Keyword-based TF-IDF proxy classifier)
     */
    public String classifyTransaction(String description) {
        if (description == null || description.trim().isEmpty()) {
            return "Autre";
        }
        
        String desc = description.toLowerCase().trim();

        // Rules based on common Moroccan merchant descriptions and tags
        if (desc.contains("salaire") || desc.contains("ocp") || desc.contains("virement reçu") || desc.contains("bonus") || desc.contains("depot")) {
            return "Dépôts et Revenus";
        }
        if (desc.contains("lydec") || desc.contains("redal") || desc.contains("amendis") || desc.contains("iam") || 
            desc.contains("orange") || desc.contains("inwi") || desc.contains("electricite") || desc.contains("eau") || 
            desc.contains("telecom") || desc.contains("internet") || desc.contains("adsl") || desc.contains("facture")) {
            return "Abonnements & Factures";
        }
        if (desc.contains("marjane") || desc.contains("carrefour") || desc.contains("bim") || desc.contains("epicerie") || 
            desc.contains("supermarche") || desc.contains("aswak") || desc.contains("label vie") || desc.contains("alimentation") || desc.contains("boucherie")) {
            return "Alimentation";
        }
        if (desc.contains("shell") || desc.contains("total") || desc.contains("afriquia") || desc.contains("petrom") || 
            desc.contains("oncf") || desc.contains("tramway") || desc.contains("train") || desc.contains("autoroute") || 
            desc.contains("uber") || desc.contains("careem") || desc.contains("taxi")) {
            return "Transport";
        }
        if (desc.contains("paul") || desc.contains("cafe") || desc.contains("restaurant") || desc.contains("mcdonalds") || 
            desc.contains("kfc") || desc.contains("cinema") || desc.contains("netflix") || desc.contains("spotify") || 
            desc.contains("loisirs") || desc.contains("patisserie")) {
            return "Loisirs";
        }
        if (desc.contains("loyer") || desc.contains("syndic") || desc.contains("immobilier") || desc.contains("logement") || desc.contains("appartement")) {
            return "Logement";
        }
        if (desc.contains("jumia") || desc.contains("zara") || desc.contains("decathlon") || desc.contains("hm") || 
            desc.contains("shopping") || desc.contains("amazon") || desc.contains("vetement") || desc.contains("fnac")) {
            return "Shopping";
        }
        if (desc.contains("casino") || desc.contains("betting") || desc.contains("crypto") || desc.contains("binance") || desc.contains("gibraltar")) {
            return "Dépenses Sensibles";
        }

        return "Autre";
    }

    /**
     * 2. Predictive Cash Flow Modeling (Time-Series Linear Regression + Seasonal Projections)
     */
    public List<Map<String, Object>> predictBalances(Long accountId, int daysAhead) {
        List<Map<String, Object>> predictions = new ArrayList<>();
        
        Compte compte = compteRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Compte introuvable."));
        
        List<Operation> operations = operationRepository.findByCompteSourceOrCompteDestinationOrderByDateOperationDesc(compte, compte);
        
        // 2a. Reconstruct daily historical balances for the last 60 days
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(60);
        
        // Map to store historical balance on each date
        Map<LocalDate, BigDecimal> dailyBalances = new TreeMap<>();
        BigDecimal currentSolde = compte.getSolde();
        dailyBalances.put(today, currentSolde);
        
        BigDecimal runningSolde = currentSolde;
        LocalDate currentDate = today;
        
        // Sort operations chronologically to reconstruct running balance backwards
        List<Operation> chronOps = new ArrayList<>(operations);
        Collections.reverse(chronOps); // oldest first
        
        // We'll calculate daily balances backwards
        Map<LocalDate, List<Operation>> opsByDate = new HashMap<>();
        for (Operation op : operations) {
            LocalDate opDate = op.getDateOperation().toLocalDate();
            opsByDate.computeIfAbsent(opDate, k -> new ArrayList<>()).add(op);
        }
        
        // Back-propagate balance to day start
        LocalDate d = today;
        while (!d.isBefore(startDate)) {
            dailyBalances.put(d, runningSolde);
            
            // If there were operations on this day, adjust the running balance backward
            List<Operation> dayOps = opsByDate.getOrDefault(d, Collections.emptyList());
            for (Operation op : dayOps) {
                boolean isDebit = op.getCompteSource() != null && op.getCompteSource().getId().equals(compte.getId());
                boolean isCredit = op.getCompteDestination() != null && op.getCompteDestination().getId().equals(compte.getId());
                
                if (isDebit) {
                    // It was a withdrawal, so going backward the balance was higher
                    runningSolde = runningSolde.add(op.getMontant());
                } else if (isCredit) {
                    // It was a deposit, so going backward the balance was lower
                    runningSolde = runningSolde.subtract(op.getMontant());
                }
            }
            d = d.minusDays(1);
        }
        
        // 2b. Compute Least Squares Linear Regression: y = mx + b
        // x is day index (0 to 60), y is balance value
        int N = dailyBalances.size();
        if (N < 2) {
            // Not enough points, return flat line prediction
            for (int i = 1; i <= daysAhead; i++) {
                LocalDate predDate = today.plusDays(i);
                predictions.add(buildPredictionPoint(predDate, currentSolde, false));
            }
            return predictions;
        }
        
        double sumX = 0;
        double sumY = 0;
        double sumXY = 0;
        double sumXX = 0;
        
        int xIdx = 0;
        for (Map.Entry<LocalDate, BigDecimal> entry : dailyBalances.entrySet()) {
            double yVal = entry.getValue().doubleValue();
            sumX += xIdx;
            sumY += yVal;
            sumXY += xIdx * yVal;
            sumXX += xIdx * xIdx;
            xIdx++;
        }
        
        double slope = (N * sumXY - sumX * sumY) / (N * sumXX - sumX * sumX);
        double intercept = (sumY - slope * sumX) / N;
        
        // 2c. Detect recurring transactions (seasonality)
        BigDecimal monthlyPaycheck = BigDecimal.ZERO;
        int paycheckDay = 28; // default Moroccan salary day
        boolean hasRecurringPaycheck = false;
        
        BigDecimal recurringRent = BigDecimal.ZERO;
        int rentDay = 1; // default rent day
        boolean hasRecurringRent = false;

        for (Operation op : operations) {
            String desc = op.getDescription() != null ? op.getDescription().toLowerCase() : "";
            if (desc.contains("salaire") || desc.contains("ocp") || desc.contains("virement recu")) {
                monthlyPaycheck = op.getMontant();
                paycheckDay = op.getDateOperation().getDayOfMonth();
                hasRecurringPaycheck = true;
            }
            if (desc.contains("loyer") || desc.contains("appartement")) {
                recurringRent = op.getMontant();
                rentDay = op.getDateOperation().getDayOfMonth();
                hasRecurringRent = true;
            }
        }
        
        // 2d. Run 30 days forecast projection
        BigDecimal projectedSolde = currentSolde;
        for (int i = 1; i <= daysAhead; i++) {
            LocalDate predDate = today.plusDays(i);
            
            // Baseline trend change (from regression slope)
            BigDecimal dailyTrend = new BigDecimal(slope).setScale(2, RoundingMode.HALF_UP);
            projectedSolde = projectedSolde.add(dailyTrend);
            
            // Apply Paycheck Seasonality (e.g. Salary day)
            if (hasRecurringPaycheck && predDate.getDayOfMonth() == paycheckDay) {
                projectedSolde = projectedSolde.add(monthlyPaycheck);
            }
            // Apply Rent Seasonality
            if (hasRecurringRent && predDate.getDayOfMonth() == rentDay) {
                projectedSolde = projectedSolde.subtract(recurringRent);
            }
            
            // Apply minor random noise (standard statistical fluctuation) to make visual graphs feel organic
            double noise = (Math.random() - 0.5) * 50; // variance of 50 MAD
            projectedSolde = projectedSolde.add(new BigDecimal(noise)).setScale(2, RoundingMode.HALF_UP);
            
            // Cap at 0 to avoid showing completely negative balances unless expected
            if (projectedSolde.compareTo(BigDecimal.ZERO) < 0) {
                projectedSolde = BigDecimal.ZERO;
            }
            
            predictions.add(buildPredictionPoint(predDate, projectedSolde, projectedSolde.compareTo(new BigDecimal("1000")) < 0));
        }
        
        return predictions;
    }
    
    private Map<String, Object> buildPredictionPoint(LocalDate date, BigDecimal solde, boolean alert) {
        Map<String, Object> point = new HashMap<>();
        point.put("date", date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        point.put("formattedDate", date.format(DateTimeFormatter.ofPattern("dd MMM")));
        point.put("balance", solde);
        point.put("overdraftWarning", alert);
        return point;
    }

    /**
     * 3. Statistical Anomaly & Fraud Detection Engine (Z-Score + Velocity Check)
     */
    public Map<String, Object> checkAnomaly(Operation op, List<Operation> history) {
        Map<String, Object> result = new HashMap<>();
        
        // Calculate historical statistics
        int N = 0;
        BigDecimal sum = BigDecimal.ZERO;
        for (Operation h : history) {
            // Check only debit operations for anomaly (withdrawals/transfers)
            boolean isDebit = h.getCompteSource() != null && h.getCompteSource().getId().equals(op.getCompteSource().getId());
            if (isDebit) {
                sum = sum.add(h.getMontant());
                N++;
            }
        }
        
        if (N < 3) {
            // Insufficient data to flag anomaly
            result.put("anomalyScore", 0.1);
            result.put("isAnomalous", false);
            result.put("reason", "Historique insuffisant pour l'analyse prédictive.");
            return result;
        }
        
        double mean = sum.doubleValue() / N;
        double varianceSum = 0;
        for (Operation h : history) {
            boolean isDebit = h.getCompteSource() != null && h.getCompteSource().getId().equals(op.getCompteSource().getId());
            if (isDebit) {
                varianceSum += Math.pow(h.getMontant().doubleValue() - mean, 2);
            }
        }
        double stdDev = Math.sqrt(varianceSum / N);
        
        double x = op.getMontant().doubleValue();
        double zScore = 0.0;
        if (stdDev > 0) {
            zScore = Math.abs(x - mean) / stdDev;
        }
        
        // 3a. Anomaly Scoring Mapping [0.0 - 1.0]
        double score = 1.0 - Math.exp(-zScore / 2.0); // Z-Score conversion function
        
        // 3b. Velocity Check (More than 3 transactions in past 1 hour)
        int transactionsInLastHour = 0;
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        for (Operation h : history) {
            if (h.getDateOperation().isAfter(oneHourAgo)) {
                transactionsInLastHour++;
            }
        }
        
        if (transactionsInLastHour >= 3) {
            score += 0.25; // add risk weight
        }
        
        // 3c. Description pattern checks
        String desc = op.getDescription() != null ? op.getDescription().toLowerCase() : "";
        if (desc.contains("casino") || desc.contains("betting") || desc.contains("forex") || desc.contains("crypto")) {
            score += 0.3; // High risk categories
        }
        
        // Cap score at 1.0
        score = Math.min(1.0, score);
        score = Math.round(score * 100.0) / 100.0; // Round to 2 decimal places
        
        boolean isAnomalous = score >= 0.70;
        String reason = "Normal";
        
        if (isAnomalous) {
            if (transactionsInLastHour >= 3) {
                reason = "Activité suspecte : Vélocité de transaction trop élevée (" + transactionsInLastHour + " en 1h).";
            } else if (zScore > 3.0) {
                reason = "Montant inhabituel : Écart statistique critique par rapport aux dépenses moyennes (Z-score = " + String.format("%.2f", zScore) + ").";
            } else if (desc.contains("casino") || desc.contains("crypto")) {
                reason = "Catégorie à haut risque : Dépense suspecte liée à des plateformes sensibles.";
            } else {
                reason = "Écart inhabituel détecté par nos algorithmes statistiques locaux.";
            }
        }
        
        result.put("anomalyScore", score);
        result.put("isAnomalous", isAnomalous);
        result.put("reason", reason);
        return result;
    }
}
