package com.banquesys.controller;

import com.banquesys.model.Compte;
import com.banquesys.model.Operation;
import com.banquesys.repository.CompteRepository;
import com.banquesys.repository.OperationRepository;
import com.banquesys.service.external.chatbot.MlAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/analytics")
public class MlAnalyticsController {

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private OperationRepository operationRepository;

    @Autowired
    private MlAnalyticsService mlAnalyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getAnalyticsDashboard(@RequestParam Long accountId) {
        try {
            Compte compte = compteRepository.findById(accountId)
                    .orElseThrow(() -> new RuntimeException("Compte introuvable."));

            List<Operation> operations = operationRepository.findByCompteSourceOrCompteDestinationOrderByDateOperationDesc(compte, compte);

            // 1. Calculate Monthly Cash Flow In / Out (Last 30 days)
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            BigDecimal totalIn = BigDecimal.ZERO;
            BigDecimal totalOut = BigDecimal.ZERO;

            Map<String, BigDecimal> categorySpendMap = new HashMap<>();
            List<Map<String, Object>> anomalyAlerts = new ArrayList<>();

            for (int i = 0; i < operations.size(); i++) {
                Operation op = operations.get(i);
                boolean isDebit = op.getCompteSource() != null && op.getCompteSource().getId().equals(compte.getId());
                boolean isCredit = op.getCompteDestination() != null && op.getCompteDestination().getId().equals(compte.getId());

                if (op.getDateOperation().isAfter(thirtyDaysAgo)) {
                    if (isDebit) {
                        totalOut = totalOut.add(op.getMontant());
                        
                        // Classify category dynamically if empty, otherwise use database category
                        String cat = op.getCategorie();
                        if (cat == null || cat.trim().isEmpty()) {
                            cat = mlAnalyticsService.classifyTransaction(op.getDescription());
                            op.setCategorie(cat); // temporarily cache
                        }
                        categorySpendMap.put(cat, categorySpendMap.getOrDefault(cat, BigDecimal.ZERO).add(op.getMontant()));
                    } else if (isCredit) {
                        totalIn = totalIn.add(op.getMontant());
                    }
                }

                // 2. Anomaly Checks for recent operations (Limit check to the last 20 operations to optimize database latency)
                if (isDebit && anomalyAlerts.size() < 10 && i < 30) {
                    // History is all remaining operations chronologically
                    List<Operation> history = new ArrayList<>(operations.subList(i + 1, operations.size()));
                    Map<String, Object> check = mlAnalyticsService.checkAnomaly(op, history);
                    
                    if ((Boolean) check.get("isAnomalous") || (Double) check.get("anomalyScore") >= 0.65) {
                        Map<String, Object> alert = new HashMap<>();
                        alert.put("transactionId", op.getId());
                        alert.put("description", op.getDescription());
                        alert.put("amount", op.getMontant());
                        alert.put("date", op.getDateOperation().toLocalDate().toString());
                        alert.put("anomalyScore", check.get("anomalyScore"));
                        alert.put("reason", check.get("reason"));
                        anomalyAlerts.add(alert);
                    }
                }
            }

            // Calculate Category Percentages relative to totalOut
            List<Map<String, Object>> categoriesRatios = new ArrayList<>();
            if (totalOut.compareTo(BigDecimal.ZERO) > 0) {
                for (Map.Entry<String, BigDecimal> entry : categorySpendMap.entrySet()) {
                    BigDecimal percent = entry.getValue().multiply(new BigDecimal("100")).divide(totalOut, 0, RoundingMode.HALF_UP);
                    
                    Map<String, Object> catObj = new HashMap<>();
                    catObj.put("category", entry.getKey());
                    catObj.put("amount", entry.getValue());
                    catObj.put("percent", percent.intValue());
                    
                    // Assign matching colors for frontend visual rendering
                    String color = "primary.main";
                    if (entry.getKey().equalsIgnoreCase("Alimentation")) color = "success.main";
                    else if (entry.getKey().equalsIgnoreCase("Transport")) color = "#42E8FF";
                    else if (entry.getKey().equalsIgnoreCase("Loisirs")) color = "#FFB703";
                    else if (entry.getKey().equalsIgnoreCase("Logement")) color = "error.main";
                    else if (entry.getKey().equalsIgnoreCase("Shopping")) color = "#FF5F00";
                    else if (entry.getKey().contains("Factures")) color = "warning.main";
                    
                    catObj.put("color", color);
                    categoriesRatios.add(catObj);
                }
            } else {
                // Return default ratios if no expenses recorded
                categoriesRatios.add(Map.of("category", "Aucune dépense", "amount", BigDecimal.ZERO, "percent", 0, "color", "text.secondary"));
            }

            // 3. Daily Balance Predictions for the next 30 days
            List<Map<String, Object>> predictions = mlAnalyticsService.predictBalances(compte.getId(), 30);

            // Assemble Response payload
            Map<String, Object> dashboardData = new HashMap<>();
            dashboardData.put("accountId", compte.getId());
            dashboardData.put("currency", compte.getDevise().toString());
            dashboardData.put("totalIn", totalIn);
            dashboardData.put("totalOut", totalOut);
            dashboardData.put("categoriesRatios", categoriesRatios);
            dashboardData.put("predictions", predictions);
            dashboardData.put("anomalies", anomalyAlerts);

            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erreur lors de la génération de l'analyse ML : " + e.getMessage()));
        }
    }
}
