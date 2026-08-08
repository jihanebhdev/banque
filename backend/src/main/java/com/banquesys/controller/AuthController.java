package com.banquesys.controller;

import com.banquesys.dto.request.LoginRequest;
import com.banquesys.dto.request.SignupRequest;
import com.banquesys.dto.response.JwtResponse;
import com.banquesys.dto.response.MessageResponse;
import com.banquesys.model.*;
import com.banquesys.repository.PasswordResetTokenRepository;
import com.banquesys.repository.UtilisateurRepository;
import com.banquesys.security.UserDetailsImpl;
import com.banquesys.security.jwt.JwtUtils;
import com.banquesys.service.AuditService;
import com.banquesys.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UtilisateurRepository userRepository;

    @Autowired
    PasswordResetTokenRepository tokenRepository;

    @Autowired
    EmailService emailService;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    AuditService auditService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty() ||
            loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Erreur: L'e-mail et le mot de passe sont requis !"));
        }

        if (!loginRequest.getEmail().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Erreur: Format de l'adresse e-mail invalide !"));
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail().trim(), loginRequest.getPassword()));
        } catch (AuthenticationException ex) {
            // Log failed login attempt — critical for fraud detection
            auditService.log("LOGIN_FAILURE", "Utilisateur", null,
                    "Échec authentification pour email: " + loginRequest.getEmail(),
                    AuditSeverity.WARNING, AuditStatus.FAILURE);
            return ResponseEntity
                    .status(401)
                    .body(new MessageResponse("Adresse e-mail ou mot de passe incorrect."));
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        Utilisateur user = userRepository.findByEmail(userDetails.getUsername()).get();

        String telephone = null;
        String dateNaissance = null;
        String adresse = null;
        String numeroPasseport = null;
        String dateDelivrance = null;
        String numeroNif = null;
        String paysResidenceFiscale = null;
        String profession = null;
        String trancheRevenus = null;
        String origineFonds = null;

        if (user instanceof Client) {
            Client c = (Client) user;
            telephone = c.getTelephone();
            dateNaissance = c.getDateNaissance();
            adresse = c.getAdresse();
            numeroPasseport = c.getNumeroPasseport();
            dateDelivrance = c.getDateDelivrance();
            numeroNif = c.getNumeroNif();
            paysResidenceFiscale = c.getPaysResidenceFiscale();
            profession = c.getProfession();
            trancheRevenus = c.getTrancheRevenus();
            origineFonds = c.getOrigineFonds();
        }

        JwtResponse response = new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getNom(),
                userDetails.getPrenom(),
                userDetails.getRole(),
                user.getKycStatus().name(),
                telephone, dateNaissance, adresse,
                numeroPasseport, dateDelivrance, numeroNif, paysResidenceFiscale,
                profession, trancheRevenus, origineFonds,
                user.getAvatar());
        if (user instanceof Client) {
            response.setEpargneIntelligenteActive(((Client) user).isEpargneIntelligenteActive());
            response.setContratGenere(((Client) user).getContratGenere());
            response.setContratSigne(((Client) user).getContratSigne());
            response.setContratContenu(((Client) user).getContratContenu());
            response.setOpensignEnvelopeId(((Client) user).getOpensignEnvelopeId());
            response.setOpensignSigningUrl(((Client) user).getOpensignSigningUrl());
        }

        // Log successful login
        auditService.logInfo("LOGIN_SUCCESS", "Utilisateur", userDetails.getId(),
                "Connexion réussie: " + userDetails.getUsername() + " [" + userDetails.getRole() + "]");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        if (signUpRequest.getEmail() == null || signUpRequest.getEmail().trim().isEmpty() ||
            signUpRequest.getPassword() == null || signUpRequest.getPassword().trim().isEmpty() ||
            signUpRequest.getNom() == null || signUpRequest.getNom().trim().isEmpty() ||
            signUpRequest.getPrenom() == null || signUpRequest.getPrenom().trim().isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Erreur: Tous les champs sont requis !"));
        }

        if (!signUpRequest.getEmail().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Erreur: Format de l'adresse e-mail invalide !"));
        }

        if (signUpRequest.getPassword().trim().length() < 6) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Erreur: Le mot de passe doit contenir au moins 6 caractères !"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail().trim())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Erreur: L'email est déjà utilisé !"));
        }

        // Determine Role (Default is CLIENT)
        String strRole = signUpRequest.getRole();
        Utilisateur user;

        if (strRole == null) {
            user = new Client(signUpRequest.getNom().trim(), signUpRequest.getPrenom().trim(), 
                              signUpRequest.getEmail().trim(), encoder.encode(signUpRequest.getPassword().trim()));
        } else {
            switch (strRole.toUpperCase()) {
                case "ADMIN":
                    user = new Administrateur(signUpRequest.getNom().trim(), signUpRequest.getPrenom().trim(), 
                                               signUpRequest.getEmail().trim(), encoder.encode(signUpRequest.getPassword().trim()));
                    break;
                case "EMPLOYE":
                    user = new Employe(signUpRequest.getNom().trim(), signUpRequest.getPrenom().trim(), 
                                       signUpRequest.getEmail().trim(), encoder.encode(signUpRequest.getPassword().trim()));
                    break;
                default:
                    user = new Client(signUpRequest.getNom().trim(), signUpRequest.getPrenom().trim(), 
                                      signUpRequest.getEmail().trim(), encoder.encode(signUpRequest.getPassword().trim()));
            }
        }

        userRepository.save(user);

        // Audit registration
        auditService.logSuccess("REGISTER", "Utilisateur", user.getId(),
                "Nouveau compte enregistré: " + user.getPrenom() + " " + user.getNom() +
                        " (" + user.getEmail() + ") [" + user.getRole() + "]");

        // Send Welcome email (mocked console output or Mailtrap sandbox)
        if (user instanceof Client) {
            try {
                emailService.sendWelcomeEmail(user.getEmail(), user.getPrenom() + " " + user.getNom());
            } catch (Exception e) {
                System.err.println("Could not send welcome email: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(new MessageResponse("Utilisateur enregistré avec succès !"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("L'adresse e-mail est requise."));
        }

        Optional<Utilisateur> userOpt = userRepository.findByEmail(email.trim());
        if (userOpt.isEmpty()) {
            // Return 200 to prevent user enumeration security issues
            return ResponseEntity.ok(new MessageResponse("Si cet e-mail existe, un lien de réinitialisation vous a été envoyé."));
        }

        Utilisateur user = userOpt.get();

        // Remove any existing password tokens for this user
        Optional<PasswordResetToken> existingToken = tokenRepository.findByUtilisateur(user);
        existingToken.ifPresent(token -> tokenRepository.delete(token));

        // Generate reset token
        String tokenStr = UUID.randomUUID().toString();
        PasswordResetToken token = new PasswordResetToken(tokenStr, user, 15);
        tokenRepository.save(token);

        // Send reset email
        String resetUrl = "http://localhost:3000/reset-password?token=" + tokenStr;
        emailService.sendPasswordResetEmail(user.getEmail(), resetUrl);

        return ResponseEntity.ok(new MessageResponse("Si cet e-mail existe, un lien de réinitialisation vous a été envoyé."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> payload) {
        String tokenStr = payload.get("token");
        String newPassword = payload.get("password");

        if (tokenStr == null || newPassword == null || tokenStr.trim().isEmpty() || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Jeton et nouveau mot de passe requis."));
        }

        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(tokenStr.trim());
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Jeton de réinitialisation invalide ou introuvable."));
        }

        PasswordResetToken token = tokenOpt.get();
        if (token.isExpired()) {
            tokenRepository.delete(token);
            return ResponseEntity.badRequest().body(new MessageResponse("Ce lien de réinitialisation a expiré."));
        }

        Utilisateur user = token.getUtilisateur();
        user.setMotDePasse(encoder.encode(newPassword));
        userRepository.save(user);

        // Delete token after successful reset
        tokenRepository.delete(token);

        auditService.logWarning("PASSWORD_RESET", "Utilisateur", user.getId(),
                "Réinitialisation mot de passe self-service pour: " + user.getEmail());

        return ResponseEntity.ok(new MessageResponse("Votre mot de passe a été réinitialisé avec succès !"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(new MessageResponse("Non authentifié"));
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Utilisateur user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String telephone = null;
        String dateNaissance = null;
        String adresse = null;
        String numeroPasseport = null;
        String dateDelivrance = null;
        String numeroNif = null;
        String paysResidenceFiscale = null;
        String profession = null;
        String trancheRevenus = null;
        String origineFonds = null;

        if (user instanceof Client) {
            Client c = (Client) user;
            telephone = c.getTelephone();
            dateNaissance = c.getDateNaissance();
            adresse = c.getAdresse();
            numeroPasseport = c.getNumeroPasseport();
            dateDelivrance = c.getDateDelivrance();
            numeroNif = c.getNumeroNif();
            paysResidenceFiscale = c.getPaysResidenceFiscale();
            profession = c.getProfession();
            trancheRevenus = c.getTrancheRevenus();
            origineFonds = c.getOrigineFonds();
        }

        JwtResponse response = new JwtResponse("", 
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getNom(),
                userDetails.getPrenom(),
                userDetails.getRole(),
                user.getKycStatus().name(),
                telephone, dateNaissance, adresse,
                numeroPasseport, dateDelivrance, numeroNif, paysResidenceFiscale,
                profession, trancheRevenus, origineFonds,
                user.getAvatar());
        if (user instanceof Client) {
            response.setEpargneIntelligenteActive(((Client) user).isEpargneIntelligenteActive());
            response.setContratGenere(((Client) user).getContratGenere());
            response.setContratSigne(((Client) user).getContratSigne());
            response.setContratContenu(((Client) user).getContratContenu());
            response.setOpensignEnvelopeId(((Client) user).getOpensignEnvelopeId());
            response.setOpensignSigningUrl(((Client) user).getOpensignSigningUrl());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sign-contract")
    public ResponseEntity<?> signContract(@RequestBody java.util.Map<String, String> payload) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(new MessageResponse("Non authentifié"));
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Utilisateur user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(user instanceof Client)) {
            return ResponseEntity.badRequest().body(new MessageResponse("L'utilisateur n'est pas un client"));
        }

        Client client = (Client) user;
        String signatureBase64 = payload.get("signatureBase64");
        if (signatureBase64 == null || signatureBase64.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("La signature est obligatoire."));
        }

        client.setSignatureBase64(signatureBase64);
        client.setContratSigne(true);
        client.setDateSignature(java.time.LocalDateTime.now().toString());
        userRepository.save(client);

        // Log signature audit
        auditService.logSuccess("CONTRACT_SIGNED", "Client", client.getId(),
                "Contrat signé électroniquement par client: " + client.getPrenom() + " " + client.getNom());

        return ResponseEntity.ok(new MessageResponse("Contrat signé avec succès !"));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody java.util.Map<String, String> payload) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(new MessageResponse("Non authentifié"));
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        String oldPassword = payload.get("oldPassword");
        String newPassword = payload.get("newPassword");

        if (oldPassword == null || newPassword == null || oldPassword.trim().isEmpty() || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Les mots de passe sont requis."));
        }

        Utilisateur user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!encoder.matches(oldPassword, user.getMotDePasse())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Ancien mot de passe incorrect."));
        }

        user.setMotDePasse(encoder.encode(newPassword));
        userRepository.save(user);

        auditService.logWarning("PASSWORD_CHANGE", "Utilisateur", userDetails.getId(),
                "Changement de mot de passe auto-initié par: " + userDetails.getUsername());

        return ResponseEntity.ok(new MessageResponse("Mot de passe mis à jour avec succès !"));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody java.util.Map<String, String> payload) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(new MessageResponse("Non authentifié"));
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Utilisateur user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (payload.containsKey("nom")) {
            user.setNom(payload.get("nom"));
        }
        if (payload.containsKey("prenom")) {
            user.setPrenom(payload.get("prenom"));
        }
        if (payload.containsKey("email")) {
            String newEmail = payload.get("email");
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                return ResponseEntity.badRequest().body(new MessageResponse("Erreur: L'email est déjà utilisé !"));
            }
            user.setEmail(newEmail);
        }
        if (payload.containsKey("avatar")) {
            user.setAvatar(payload.get("avatar"));
        }
        if (user instanceof Client) {
            Client c = (Client) user;
            if (payload.containsKey("telephone")) c.setTelephone(payload.get("telephone"));
            if (payload.containsKey("adresse")) c.setAdresse(payload.get("adresse"));
            if (payload.containsKey("dateNaissance")) c.setDateNaissance(payload.get("dateNaissance"));
            if (payload.containsKey("numeroPasseport")) c.setNumeroPasseport(payload.get("numeroPasseport"));
            if (payload.containsKey("dateDelivrance")) c.setDateDelivrance(payload.get("dateDelivrance"));
            if (payload.containsKey("numeroNif")) c.setNumeroNif(payload.get("numeroNif"));
            if (payload.containsKey("paysResidenceFiscale")) c.setPaysResidenceFiscale(payload.get("paysResidenceFiscale"));
            if (payload.containsKey("profession")) c.setProfession(payload.get("profession"));
            if (payload.containsKey("trancheRevenus")) c.setTrancheRevenus(payload.get("trancheRevenus"));
            if (payload.containsKey("origineFonds")) c.setOrigineFonds(payload.get("origineFonds"));
            if (payload.containsKey("epargneIntelligenteActive")) {
                c.setEpargneIntelligenteActive(Boolean.parseBoolean(payload.get("epargneIntelligenteActive")));
            }
        }

        userRepository.save(user);

        auditService.logInfo("PROFILE_UPDATE", "Utilisateur", userDetails.getId(),
                "Mise à jour profil par: " + userDetails.getUsername() + " - champs modifiés: " + payload.keySet());

        return ResponseEntity.ok(new MessageResponse("Profil mis à jour avec succès !"));
    }
}
