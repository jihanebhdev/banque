package com.banquesys.service.external;

import com.banquesys.model.Operation;

public interface CentralBankReportingService {
    void reportTransaction(Operation operation);
}
