package com.banquesys.service.external.impl;

import com.banquesys.model.Operation;
import com.banquesys.service.external.CentralBankReportingService;
import org.springframework.stereotype.Service;

@Service
public class MockCentralBankReportingService implements CentralBankReportingService {
    @Override
    public void reportTransaction(Operation operation) {
        System.out.println("[MOCK REGULATORY REPORT] Reporting transaction " + operation.getId() + " of amount " + operation.getMontant() + " to Central Bank.");
    }
}
