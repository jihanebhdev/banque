package com.banquesys.repository;

import com.banquesys.model.Carte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarteRepository extends JpaRepository<Carte, Long> {
    List<Carte> findByCompteClientId(Long clientId);
    List<Carte> findByCompteId(Long compteId);
    Optional<Carte> findByNumeroCarte(String numeroCarte);
}
