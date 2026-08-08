package com.banquesys.config;

import com.banquesys.model.*;
import com.banquesys.repository.CompteRepository;
import com.banquesys.repository.UtilisateurRepository;
import com.banquesys.repository.OperationRepository;
import com.banquesys.service.external.chatbot.MlAnalyticsService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DatabaseSeeder {

    @Autowired
    private UtilisateurRepository userRepository;

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private OperationRepository operationRepository;

    @Autowired
    private MlAnalyticsService mlAnalyticsService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostConstruct
    public void seed() {
        if (userRepository.count() == 0) {
            System.out.println("[SEED] Database is empty. Seeding default users...");

            // 1. Seed Admin
            Administrateur admin = new Administrateur("Admin", "System", "admin@banque-sys.com", passwordEncoder.encode("admin"));
            admin.setKycStatus(KycStatus.VALIDATED);
            userRepository.save(admin);
            System.out.println("[SEED] Seeded Admin: admin@banque-sys.com / admin");

            // 2. Seed Employee
            Employe employee = new Employe("Employee", "Staff", "employee@banque-sys.com", passwordEncoder.encode("employee"));
            employee.setKycStatus(KycStatus.VALIDATED);
            userRepository.save(employee);
            System.out.println("[SEED] Seeded Employee: employee@banque-sys.com / employee");

            // 3. Seed Client (John Doe)
            Client client = new Client("Doe", "John", "client@gmail.com", passwordEncoder.encode("client"));
            client.setKycStatus(KycStatus.VALIDATED);
            client.setTelephone("+212612345678");
            client.setAdresse("123, Boulevard Hassan II, Casablanca");
            client.setDateNaissance("1990-01-01");
            client.setContratGenere(true);
            client.setContratSigne(true);
            userRepository.save(client);
            System.out.println("[SEED] Seeded Client: client@gmail.com / client");

            // 4. Seed a bank account for the Client
            Compte compte = new Compte("MA6412345678901234567890", TypeCompte.STANDARD, Devise.MAD, client);
            compte.setSolde(new BigDecimal("15250.75"));
            compteRepository.save(compte);
            System.out.println("[SEED] Seeded Account MA6412345678901234567890 with 15250.75 MAD for John Doe");

            // 5. Seed historical operations over 60 days for cash flow predictions
            seedTransactions(compte);
        } else {
            System.out.println("[SEED] Users already present. Ensuring default passwords match documentation...");
            
            userRepository.findByEmail("employee@banque-sys.com").ifPresent(u -> {
                u.setMotDePasse(passwordEncoder.encode("employee"));
                userRepository.save(u);
                System.out.println("[SEED] Updated password for employee@banque-sys.com to 'employee'");
            });

            userRepository.findByEmail("client@gmail.com").ifPresent(u -> {
                u.setMotDePasse(passwordEncoder.encode("client"));
                userRepository.save(u);
                System.out.println("[SEED] Updated password for client@gmail.com to 'client'");
            });

            userRepository.findByEmail("admin@banque-sys.com").ifPresent(u -> {
                u.setMotDePasse(passwordEncoder.encode("admin"));
                userRepository.save(u);
                System.out.println("[SEED] Updated password for admin@banque-sys.com to 'admin'");
            });

            // If operations are empty, seed them for existing users
            compteRepository.findAll().stream().findFirst().ifPresent(compte -> {
                if (operationRepository.count() == 0) {
                    seedTransactions(compte);
                }
            });
        }
        
        // Seed additional complex profiles if not present (runs in both cases)
        seedComplexProfiles();

        // Re-classify all existing operations to apply new classification rules
        reclassifyAllOperations();
    }

    private void reclassifyAllOperations() {
        System.out.println("[SEED] Re-classifying all existing operations with the latest ML rules...");
        operationRepository.findAll().forEach(op -> {
            String newCat = mlAnalyticsService.classifyTransaction(op.getDescription());
            if (!newCat.equals(op.getCategorie())) {
                op.setCategorie(newCat);
                operationRepository.save(op);
                System.out.println("[SEED] Reclassified transaction: " + op.getDescription() + " -> " + newCat);
            }
        });
        System.out.println("[SEED] Finished re-classifying operations.");
    }

    private void seedComplexProfiles() {
        // 1. Seed Amin El Amrani (Standard/Budget)
        if (userRepository.findByEmail("amin@gmail.com").isEmpty()) {
            Client client = new Client("El Amrani", "Amin", "amin@gmail.com", passwordEncoder.encode("client"));
            client.setKycStatus(KycStatus.VALIDATED);
            client.setTelephone("+212688887777");
            client.setAdresse("45, Avenue des FAR, Casablanca");
            client.setDateNaissance("1995-05-15");
            client.setContratGenere(true);
            client.setContratSigne(true);
            userRepository.save(client);
            System.out.println("[SEED] Seeded Amin El Amrani: amin@gmail.com / client");

            Compte compte = new Compte("MA6411112222333344445555", TypeCompte.STANDARD, Devise.MAD, client);
            compte.setSolde(new BigDecimal("1240.50"));
            compteRepository.save(compte);
            seedAminTransactions(compte);
        }

        // 2. Seed Yasmine Benjelloun (HNW)
        if (userRepository.findByEmail("yasmine@gmail.com").isEmpty()) {
            Client client = new Client("Benjelloun", "Yasmine", "yasmine@gmail.com", passwordEncoder.encode("client"));
            client.setKycStatus(KycStatus.VALIDATED);
            client.setTelephone("+212699998888");
            client.setAdresse("Villa 12, Anfa Superior, Casablanca");
            client.setDateNaissance("1988-11-20");
            client.setContratGenere(true);
            client.setContratSigne(true);
            userRepository.save(client);
            System.out.println("[SEED] Seeded Yasmine Benjelloun: yasmine@gmail.com / client");

            Compte compte = new Compte("MA6455556666777788889999", TypeCompte.STANDARD, Devise.MAD, client);
            compte.setSolde(new BigDecimal("185000.00"));
            compteRepository.save(compte);
            seedYasmineTransactions(compte);
        }

        // 3. Seed Karim Tazi (Loan/Debt)
        if (userRepository.findByEmail("karim@gmail.com").isEmpty()) {
            Client client = new Client("Tazi", "Karim", "karim@gmail.com", passwordEncoder.encode("client"));
            client.setKycStatus(KycStatus.VALIDATED);
            client.setTelephone("+212611112222");
            client.setAdresse("Apt 4, Boulevard Zerktouni, Casablanca");
            client.setDateNaissance("1983-04-02");
            client.setContratGenere(true);
            client.setContratSigne(true);
            userRepository.save(client);
            System.out.println("[SEED] Seeded Karim Tazi: karim@gmail.com / client");

            Compte compte = new Compte("MA6499990000111122223333", TypeCompte.STANDARD, Devise.MAD, client);
            compte.setSolde(new BigDecimal("4200.00"));
            compteRepository.save(compte);
            seedKarimTransactions(compte);
        }

        // 4. Seed Sarah Alami (Perfect for Predictive AI and Z-Score Anomaly Testing)
        if (userRepository.findByEmail("sarah@gmail.com").isEmpty()) {
            Client client = new Client("Alami", "Sarah", "sarah@gmail.com", passwordEncoder.encode("client"));
            client.setKycStatus(KycStatus.VALIDATED);
            client.setTelephone("+212622223333");
            client.setAdresse("Apt 15, Rue de la Ligue Arabe, Rabat");
            client.setDateNaissance("1992-09-12");
            client.setContratGenere(true);
            client.setContratSigne(true);
            userRepository.save(client);
            System.out.println("[SEED] Seeded Sarah Alami: sarah@gmail.com / client");

            Compte compte = new Compte("MA6422223333444455556666", TypeCompte.STANDARD, Devise.MAD, client);
            compte.setSolde(new BigDecimal("35000.00"));
            compteRepository.save(compte);
            seedSarahTransactions(compte);
        }
    }

    private void seedSarahTransactions(Compte compte) {
        System.out.println("[SEED] Seeding Sarah Alami's transactions...");
        
        // Month 1 (approx. 50 to 30 days ago)
        createOp(null, compte, "25000.00", "Virement Salaire OCP", OperationType.DEPOT, 50);
        createOp(compte, null, "6000.00", "Loyer Appartement Rabat", OperationType.VIREMENT, 49);
        createOp(compte, null, "250.00", "Abonnement Internet Maroc Telecom", OperationType.VIREMENT, 47);
        createOp(compte, null, "95.00", "Abonnement Spotify Premium", OperationType.VIREMENT, 45);
        createOp(compte, null, "180.00", "Facture Electricite Redal", OperationType.VIREMENT, 44);
        createOp(compte, null, "320.00", "Epicerie BIM", OperationType.RETRAIT, 42);
        createOp(compte, null, "30.00", "Café Starbucks", OperationType.RETRAIT, 41);
        createOp(compte, null, "45.00", "Uber Ride", OperationType.RETRAIT, 39);
        createOp(compte, null, "450.00", "Courses Marjane", OperationType.RETRAIT, 37);
        createOp(compte, null, "35.00", "Café Starbucks", OperationType.RETRAIT, 35);
        createOp(compte, null, "40.00", "Uber Ride", OperationType.RETRAIT, 33);
        createOp(compte, null, "300.00", "Epicerie BIM", OperationType.RETRAIT, 31);

        // Month 2 (approx. 20 days ago to present)
        createOp(null, compte, "25000.00", "Virement Salaire OCP", OperationType.DEPOT, 20);
        createOp(compte, null, "6000.00", "Loyer Appartement Rabat", OperationType.VIREMENT, 19);
        createOp(compte, null, "250.00", "Abonnement Internet Maroc Telecom", OperationType.VIREMENT, 17);
        createOp(compte, null, "95.00", "Abonnement Spotify Premium", OperationType.VIREMENT, 15);
        createOp(compte, null, "195.00", "Facture Electricite Redal", OperationType.VIREMENT, 14);
        createOp(compte, null, "340.00", "Epicerie BIM", OperationType.RETRAIT, 12);
        createOp(compte, null, "35.00", "Café Starbucks", OperationType.RETRAIT, 11);
        createOp(compte, null, "40.00", "Uber Ride", OperationType.RETRAIT, 10);
        createOp(compte, null, "480.00", "Courses Marjane", OperationType.RETRAIT, 8);
        createOp(compte, null, "30.00", "Café Starbucks", OperationType.RETRAIT, 6);
        createOp(compte, null, "45.00", "Uber Ride", OperationType.RETRAIT, 4);

        // --- ANOMALIES FOR Z-SCORE AND VELOCITY TESTING ---
        // Anomaly 1: Massive spending outlier
        createOp(compte, null, "18500.00", "Achat Jetons Crypto Coinbase", OperationType.VIREMENT, 1);

        // Anomaly 2: Velocity Spikes today
        createOp(compte, null, "4500.00", "Retrait Cash GAB Rabat", OperationType.RETRAIT, 0);
        createOp(compte, null, "5000.00", "Virement Urgent Epargne", OperationType.VIREMENT, 0);
        createOp(compte, null, "7500.00", "Retrait inhabituel – Plateforme inconnue", OperationType.VIREMENT, 0);
    }

    private void seedAminTransactions(Compte compte) {
        System.out.println("[SEED] Seeding Amin El Amrani's transactions...");
        // Month 1
        createOp(null, compte, "8500.00", "Virement Salaire OCP", OperationType.DEPOT, 50);
        createOp(compte, null, "2800.00", "Loyer Casablanca", OperationType.VIREMENT, 49);
        createOp(compte, null, "180.00", "Facture Lydec", OperationType.VIREMENT, 45);
        createOp(compte, null, "199.00", "Maroc Telecom ADSL", OperationType.VIREMENT, 44);
        createOp(compte, null, "35.00", "Careem Ride", OperationType.RETRAIT, 42);
        createOp(compte, null, "150.00", "Epicerie BIM", OperationType.RETRAIT, 41);
        createOp(compte, null, "40.00", "Café Starbucks", OperationType.RETRAIT, 39);
        createOp(compte, null, "350.00", "Achat Jumia", OperationType.RETRAIT, 36);
        createOp(compte, null, "85.00", "Epicerie BIM", OperationType.RETRAIT, 33);
        
        // Month 2
        createOp(null, compte, "8500.00", "Virement Salaire OCP", OperationType.DEPOT, 20);
        createOp(compte, null, "2800.00", "Loyer Casablanca", OperationType.VIREMENT, 19);
        createOp(compte, null, "210.00", "Facture Lydec", OperationType.VIREMENT, 15);
        createOp(compte, null, "199.00", "Maroc Telecom ADSL", OperationType.VIREMENT, 14);
        createOp(compte, null, "120.00", "Epicerie BIM", OperationType.RETRAIT, 12);
        createOp(compte, null, "40.00", "Café Starbucks", OperationType.RETRAIT, 11);
        createOp(compte, null, "35.00", "Careem Ride", OperationType.RETRAIT, 10);
        createOp(compte, null, "160.00", "Epicerie BIM", OperationType.RETRAIT, 9);
        createOp(compte, null, "240.00", "Epicerie BIM", OperationType.RETRAIT, 8);
        createOp(compte, null, "110.00", "Epicerie BIM", OperationType.RETRAIT, 5);
        createOp(compte, null, "35.00", "Careem Ride", OperationType.RETRAIT, 3);
        createOp(compte, null, "40.00", "Café Starbucks", OperationType.RETRAIT, 2);
    }

    private void seedYasmineTransactions(Compte compte) {
        System.out.println("[SEED] Seeding Yasmine Benjelloun's transactions...");
        // Month 1
        createOp(null, compte, "45000.00", "Virement Salaire OCP Executif", OperationType.DEPOT, 50);
        createOp(compte, null, "9500.00", "Loyer Villa Bouskoura", OperationType.VIREMENT, 49);
        createOp(compte, null, "1200.00", "Facture Lydec", OperationType.VIREMENT, 45);
        createOp(compte, null, "4500.00", "Courses Carrefour Gourmet", OperationType.RETRAIT, 42);
        createOp(compte, null, "3500.00", "Shopping Zara Casablanca", OperationType.RETRAIT, 38);
        createOp(compte, null, "1500.00", "Diner Paul Villa", OperationType.RETRAIT, 35);
        
        // Month 2
        createOp(null, compte, "45000.00", "Virement Salaire OCP Executif", OperationType.DEPOT, 20);
        createOp(compte, null, "9500.00", "Loyer Villa Bouskoura", OperationType.VIREMENT, 19);
        createOp(compte, null, "1400.00", "Facture Lydec", OperationType.VIREMENT, 15);
        createOp(compte, null, "4800.00", "Courses Carrefour Gourmet", OperationType.RETRAIT, 12);
        createOp(compte, null, "2200.00", "Achat Decathlon Bouskoura", OperationType.RETRAIT, 8);
        
        // Anomaly: Casino (1 day ago)
        createOp(compte, null, "25000.00", "Paiement vers un site web suspect", OperationType.VIREMENT, 1);
        
        // Anomaly: Velocity spike today (3 transactions in last hour)
        createOp(compte, null, "8000.00", "Retrait Cash GAB", OperationType.RETRAIT, 0);
        createOp(compte, null, "15000.00", "Virement Urgent Epargne", OperationType.VIREMENT, 0);
        createOp(compte, null, "12000.00", "Achat Jetons Crypto Coinbase", OperationType.VIREMENT, 0);
    }

    private void seedKarimTransactions(Compte compte) {
        System.out.println("[SEED] Seeding Karim Tazi's transactions...");
        // Month 1
        createOp(null, compte, "15000.00", "Virement Salaire OCP", OperationType.DEPOT, 50);
        createOp(compte, null, "4500.00", "Loyer Pret Immobilier", OperationType.VIREMENT, 49);
        createOp(compte, null, "1500.00", "Remboursement Pret Auto", OperationType.VIREMENT, 48);
        createOp(compte, null, "350.00", "Facture Lydec", OperationType.VIREMENT, 45);
        createOp(compte, null, "1200.00", "Courses Carrefour Market", OperationType.RETRAIT, 42);
        createOp(compte, null, "500.00", "Plein Shell Gazole", OperationType.RETRAIT, 40);
        
        // Month 2
        createOp(null, compte, "15000.00", "Virement Salaire OCP", OperationType.DEPOT, 20);
        createOp(compte, null, "4500.00", "Loyer Pret Immobilier", OperationType.VIREMENT, 19);
        createOp(compte, null, "1500.00", "Remboursement Pret Auto", OperationType.VIREMENT, 18);
        createOp(compte, null, "380.00", "Facture Lydec", OperationType.VIREMENT, 15);
        createOp(compte, null, "1300.00", "Courses Carrefour Market", OperationType.RETRAIT, 12);
        createOp(compte, null, "550.00", "Plein Shell Gazole", OperationType.RETRAIT, 10);
    }

    private void seedTransactions(Compte compte) {
        System.out.println("[SEED] Seeding historical transactions...");
        
        // Month 1 recurring (approx. 50 days ago)
        createOp(null, compte, "12000.00", "Virement Salaire OCP", OperationType.DEPOT, 50);
        createOp(compte, null, "3500.00", "Loyer Casablanca", OperationType.VIREMENT, 49);
        createOp(compte, null, "420.00", "Facture Lydec Eau & Elec", OperationType.VIREMENT, 45);
        createOp(compte, null, "249.00", "Abonnement Maroc Telecom ADSL", OperationType.VIREMENT, 44);
        createOp(compte, null, "850.00", "Courses Carrefour Market", OperationType.RETRAIT, 42);
        createOp(compte, null, "400.00", "Plein Shell Gazole", OperationType.RETRAIT, 40);
        createOp(compte, null, "180.00", "Diner Paul Casablanca", OperationType.RETRAIT, 38);
        createOp(compte, null, "95.00", "Abonnement Netflix", OperationType.VIREMENT, 35);
        createOp(compte, null, "320.00", "Courses Marjane", OperationType.RETRAIT, 32);

        // Month 2 recurring (approx. 20 days ago)
        createOp(null, compte, "12000.00", "Virement Salaire OCP", OperationType.DEPOT, 20);
        createOp(compte, null, "3500.00", "Loyer Casablanca", OperationType.VIREMENT, 19);
        createOp(compte, null, "450.00", "Facture Lydec Eau & Elec", OperationType.VIREMENT, 15);
        createOp(compte, null, "249.00", "Abonnement Maroc Telecom ADSL", OperationType.VIREMENT, 14);
        createOp(compte, null, "900.00", "Courses Carrefour Market", OperationType.RETRAIT, 12);
        createOp(compte, null, "380.00", "Plein Total Gazole", OperationType.RETRAIT, 10);
        createOp(compte, null, "550.00", "Achat Decathlon Bouskoura", OperationType.RETRAIT, 8);
        createOp(compte, null, "120.00", "Dejeuner Paul", OperationType.RETRAIT, 6);
        createOp(compte, null, "95.00", "Abonnement Netflix", OperationType.VIREMENT, 5);
        createOp(compte, null, "280.00", "Courses Epicerie BIM", OperationType.RETRAIT, 4);
        createOp(compte, null, "45.00", "Café Starbucks", OperationType.RETRAIT, 2);

        // Seed some anomalies (1 day ago) for the fraud detection module
        createOp(compte, null, "4800.00", "Retrait inhabituel – Plateforme inconnue", OperationType.VIREMENT, 1);
        createOp(compte, null, "1200.00", "Retrait Cash GAB", OperationType.RETRAIT, 0); // today
        createOp(compte, null, "800.00", "Retrait Cash GAB 2", OperationType.RETRAIT, 0);  // today

        System.out.println("[SEED] Finished seeding 23 historical transactions.");
    }

    private void createOp(Compte src, Compte dest, String amt, String desc, OperationType type, int daysAgo) {
        Operation op = new Operation();
        op.setCompteSource(src);
        op.setCompteDestination(dest);
        op.setMontant(new BigDecimal(amt));
        op.setDescription(desc);
        op.setType(type);
        op.setCategorie(mlAnalyticsService.classifyTransaction(desc));
        op.setDateOperation(LocalDateTime.now().minusDays(daysAgo));
        operationRepository.save(op);
    }
}
