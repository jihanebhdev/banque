package com.banquesys.repository;

import com.banquesys.model.Compte;
import com.banquesys.model.Operation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperationRepository extends JpaRepository<Operation, Long> {
    List<Operation> findByCompteSourceOrCompteDestinationOrderByDateOperationDesc(Compte compteSource, Compte compteDestination);
    List<Operation> findAllByOrderByDateOperationDesc();
    List<Operation> findByDateOperationAfter(java.time.LocalDateTime date);
}
