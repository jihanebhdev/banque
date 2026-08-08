package com.banquesys.service;

import com.banquesys.model.Client;
import com.banquesys.model.Compte;
import com.banquesys.model.Devise;
import com.banquesys.model.TypeCompte;
import com.banquesys.model.Operation;
import com.banquesys.model.OperationType;
import com.banquesys.repository.CompteRepository;
import com.banquesys.repository.OperationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Random;

@Service
public class CompteService {

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private OperationRepository operationRepository;

    @Transactional
    public Compte creerCompte(Client client, String typeStr, String deviseStr) {
        TypeCompte type = TypeCompte.valueOf(typeStr.toUpperCase());
        Devise devise = Devise.valueOf(deviseStr.toUpperCase());

        String numeroIban = genererIban();
        // S'assurer de l'unicité (très rare que ça tombe deux fois sur le même, mais bonne pratique)
        while(compteRepository.existsByNumeroCompte(numeroIban)) {
            numeroIban = genererIban();
        }

        Compte compte = new Compte(numeroIban, type, devise, client);
        compte.setSolde(java.math.BigDecimal.ZERO); // Solde initial à 0
        Compte compteSauvegarde = compteRepository.save(compte);

        return compteSauvegarde;
    }

    private String genererIban() {
        // Simulation d'un IBAN Français/Européen (Simple Banque = SB)
        Random random = new Random();
        StringBuilder iban = new StringBuilder("MA64300010000"); // Code banque + guichet fictif
        for (int i = 0; i < 11; i++) {
            iban.append(random.nextInt(10));
        }
        iban.append((random.nextInt(89) + 10)); // Clé RIB
        return iban.toString();
    }
}
