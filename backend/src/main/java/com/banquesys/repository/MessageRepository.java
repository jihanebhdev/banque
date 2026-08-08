package com.banquesys.repository;

import com.banquesys.model.Message;
import com.banquesys.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByExpediteurAndDestinataireOrDestinataireAndExpediteurOrderByDateEnvoiAsc(
            Utilisateur exp1, Utilisateur dest1, Utilisateur dest2, Utilisateur exp2);

    List<Message> findByExpediteurOrDestinataireOrderByDateEnvoiAsc(Utilisateur exp, Utilisateur dest);
}
