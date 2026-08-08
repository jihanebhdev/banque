package com.banquesys.controller;

import com.banquesys.dto.response.MessageResponse;
import com.banquesys.model.Beneficiaire;
import com.banquesys.model.Client;
import com.banquesys.model.Utilisateur;
import com.banquesys.repository.BeneficiaireRepository;
import com.banquesys.repository.UtilisateurRepository;
import com.banquesys.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/beneficiaires")
public class BeneficiaireController {

    @Autowired
    private BeneficiaireRepository beneficiaireRepository;

    @Autowired
    private UtilisateurRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getBeneficiaires() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        List<Beneficiaire> list = beneficiaireRepository.findByClientId(userDetails.getId());
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<?> addBeneficiaire(@RequestBody Beneficiaire request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Utilisateur user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(user instanceof Client)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Seuls les clients peuvent gérer des bénéficiaires."));
        }

        if (request.getNom() == null || request.getNom().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Le nom du bénéficiaire est obligatoire."));
        }

        if (request.getIban() == null || request.getIban().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("L'IBAN du bénéficiaire est obligatoire."));
        }

        Client client = (Client) user;
        Beneficiaire b = new Beneficiaire(request.getNom().trim(), request.getIban().trim(), request.getNomBanque(), client);
        Beneficiaire saved = beneficiaireRepository.save(b);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBeneficiaire(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Beneficiaire b = beneficiaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bénéficiaire introuvable."));

        if (!b.getClient().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Vous n'êtes pas autorisé à supprimer ce bénéficiaire."));
        }

        beneficiaireRepository.delete(b);
        return ResponseEntity.ok(new MessageResponse("Bénéficiaire supprimé avec succès !"));
    }
}
