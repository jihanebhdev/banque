package com.banquesys.controller;

import com.banquesys.dto.response.MessageResponse;
import com.banquesys.model.*;
import com.banquesys.repository.CompteRepository;
import com.banquesys.repository.OperationRepository;
import com.banquesys.repository.UtilisateurRepository;
import com.banquesys.repository.AuditLogRepository;
import com.banquesys.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    @Autowired
    private UtilisateurRepository userRepository;

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private OperationRepository operationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    @GetMapping("/employes")
    public ResponseEntity<?> getEmployes() {
        List<Utilisateur> employes = userRepository.findByRole(RoleType.ROLE_EMPLOYE);
        return ResponseEntity.ok(employes);
    }

    @PostMapping("/employes")
    public ResponseEntity<?> createEmploye(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (userRepository.existsByEmail(email)) {
            auditService.logError("CREATE_EMPLOYE",
                    "Utilisateur", null,
                    "Échec création employé - email déjà utilisé: " + email);
            return ResponseEntity.badRequest().body(new MessageResponse("Erreur: L'email est déjà utilisé !"));
        }

        Employe employe = new Employe(
                request.get("nom"),
                request.get("prenom"),
                email,
                passwordEncoder.encode(request.get("password"))
        );
        userRepository.save(employe);

        auditService.logSuccess("CREATE_EMPLOYE",
                "Utilisateur", employe.getId(),
                "Création compte conseiller: " + employe.getPrenom() + " " + employe.getNom() + " (" + email + ")");

        return ResponseEntity.ok(new MessageResponse("Compte employé créé avec succès !"));
    }

    @DeleteMapping("/employes/{id}")
    public ResponseEntity<?> deleteEmploye(@PathVariable Long id) {
        Utilisateur user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));
        if (user.getRole() != RoleType.ROLE_EMPLOYE) {
            auditService.logError("DELETE_EMPLOYE",
                    "Utilisateur", id,
                    "Échec suppression - utilisateur ID #" + id + " n'est pas un employé");
            return ResponseEntity.badRequest().body(new MessageResponse("L'utilisateur n'est pas un employé"));
        }
        String name = user.getPrenom() + " " + user.getNom();
        userRepository.delete(user);

        auditService.logWarning("DELETE_EMPLOYE",
                "Utilisateur", id,
                "Révocation compte conseiller: " + name + " (ID #" + id + ")");

        return ResponseEntity.ok(new MessageResponse("Compte employé supprimé avec succès !"));
    }

    @GetMapping("/statistiques")
    public ResponseEntity<?> getStatistiques() {
        List<Compte> comptes = compteRepository.findAll();
        BigDecimal totalDepots = comptes.stream()
                .map(Compte::getSolde)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Utilisateur> clients = userRepository.findByRole(RoleType.ROLE_CLIENT);
        long totalClients = clients.size();

        long validatedKyc = clients.stream()
                .filter(u -> u.getKycStatus() == KycStatus.VALIDATED)
                .count();

        double ratioKyc = totalClients > 0
                ? (double) validatedKyc / totalClients * 100
                : 0.0;

        long totalTransactions = operationRepository.count();

        // 1. Group accounts by currency (devise)
        Map<String, Map<String, Object>> currencyDist = new HashMap<>();
        for (Compte c : comptes) {
            String dev = c.getDevise() != null ? c.getDevise().name() : "INCONNU";
            Map<String, Object> cData = currencyDist.computeIfAbsent(dev, k -> {
                Map<String, Object> m = new HashMap<>();
                m.put("count", 0L);
                m.put("balance", BigDecimal.ZERO);
                return m;
            });
            cData.put("count", (Long) cData.get("count") + 1);
            cData.put("balance", ((BigDecimal) cData.get("balance")).add(c.getSolde()));
        }

        // 2. Group accounts by type (typeCompte)
        Map<String, Long> accountsByType = comptes.stream()
                .filter(c -> c.getTypeCompte() != null)
                .collect(Collectors.groupingBy(c -> c.getTypeCompte().name(), Collectors.counting()));

        // 3. KYC Status breakdown
        Map<String, Long> kycBreakdown = new HashMap<>();
        kycBreakdown.put("VALIDATED", validatedKyc);
        kycBreakdown.put("PENDING", clients.stream().filter(u -> u.getKycStatus() == KycStatus.PENDING).count());
        kycBreakdown.put("SUBMITTED", clients.stream().filter(u -> u.getKycStatus() == KycStatus.SUBMITTED).count());
        kycBreakdown.put("REJECTED", clients.stream().filter(u -> u.getKycStatus() == KycStatus.REJECTED).count());
        kycBreakdown.put("NOT_STARTED", clients.stream().filter(u -> u.getKycStatus() == null).count());

        // 4. Transaction 7-Day Trend
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7).withHour(0).withMinute(0).withSecond(0).withNano(0);
        List<Operation> recentOps = operationRepository.findByDateOperationAfter(sevenDaysAgo);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        Map<String, List<Operation>> opsByDate = recentOps.stream()
                .collect(Collectors.groupingBy(op -> op.getDateOperation().format(formatter)));

        List<Map<String, Object>> trendData = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime d = LocalDateTime.now().minusDays(i);
            String dateStr = d.format(formatter);
            List<Operation> dayOps = opsByDate.getOrDefault(dateStr, Collections.emptyList());

            BigDecimal volume = dayOps.stream()
                    .map(Operation::getMontant)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> dayTrend = new HashMap<>();
            dayTrend.put("date", dateStr);
            dayTrend.put("count", dayOps.size());
            dayTrend.put("volume", volume);
            trendData.add(dayTrend);
        }

        // 5. Advisor activity workload (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Object[]> advisorData = auditLogRepository.countActionsByAdvisor(thirtyDaysAgo);
        List<Map<String, Object>> advisorWorkload = new ArrayList<>();
        for (Object[] row : advisorData) {
            Map<String, Object> advisorItem = new HashMap<>();
            advisorItem.put("email", row[0]);
            advisorItem.put("count", row[1]);
            advisorWorkload.add(advisorItem);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDepots", totalDepots);
        stats.put("totalClients", totalClients);
        stats.put("ratioKyc", BigDecimal.valueOf(ratioKyc).setScale(2, RoundingMode.HALF_UP));
        stats.put("totalTransactions", totalTransactions);
        stats.put("currencyDist", currencyDist);
        stats.put("accountsByType", accountsByType);
        stats.put("kycBreakdown", kycBreakdown);
        stats.put("trendData", trendData);
        stats.put("advisorWorkload", advisorWorkload);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/utilisateurs")
    public ResponseEntity<?> getUtilisateurs() {
        List<Utilisateur> allUsers = userRepository.findAll();
        return ResponseEntity.ok(allUsers);
    }

    @PutMapping("/utilisateurs/{id}")
    public ResponseEntity<?> updateUtilisateur(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Utilisateur user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String oldEmail = user.getEmail();
        user.setNom(request.get("nom"));
        user.setPrenom(request.get("prenom"));
        user.setEmail(request.get("email"));
        if (request.containsKey("statut")) {
            user.setStatut(request.get("statut"));
        }
        userRepository.save(user);

        auditService.logSuccess("UPDATE_USER",
                "Utilisateur", id,
                "Mise à jour utilisateur ID #" + id + " (" + user.getPrenom() + " " + user.getNom() +
                        ") - ancien email: " + oldEmail + " → nouveau: " + user.getEmail() +
                        " | statut: " + user.getStatut());

        return ResponseEntity.ok(new MessageResponse("Utilisateur mis à jour avec succès !"));
    }

    @DeleteMapping("/utilisateurs/{id}")
    public ResponseEntity<?> deleteUtilisateur(@PathVariable Long id) {
        Utilisateur user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        String info = user.getPrenom() + " " + user.getNom() + " (" + user.getEmail() + ") [" + user.getRole() + "]";
        userRepository.delete(user);

        auditService.logWarning("DELETE_USER",
                "Utilisateur", id,
                "Suppression définitive utilisateur ID #" + id + ": " + info);

        return ResponseEntity.ok(new MessageResponse("Utilisateur supprimé avec succès !"));
    }

    // Bank parameters — stored in-memory (session). Persist via GlobalConfig if persistence needed.
    private static Map<String, String> bankParams = new HashMap<>();
    static {
        bankParams.put("interestRatePremium", "2.5");
        bankParams.put("monthlyFeePremium", "9.90");
        bankParams.put("transferLimitStandard", "5000");
    }

    @GetMapping("/parametres")
    public ResponseEntity<?> getParametres() {
        return ResponseEntity.ok(bankParams);
    }

    @PostMapping("/parametres")
    public ResponseEntity<?> saveParametres(@RequestBody Map<String, String> params) {
        Map<String, String> oldParams = new HashMap<>(bankParams);
        bankParams.putAll(params);

        auditService.logWarning("UPDATE_BANK_PARAMS",
                "GlobalConfig", null,
                "Modification paramètres banque - avant: " + oldParams + " | après: " + bankParams);

        return ResponseEntity.ok(new MessageResponse("Paramètres de la banque enregistrés avec succès !"));
    }
}
