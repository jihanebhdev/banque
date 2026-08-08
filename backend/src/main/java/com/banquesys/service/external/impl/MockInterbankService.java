package com.banquesys.service.external.impl;

import com.banquesys.service.external.InterbankService;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class MockInterbankService implements InterbankService {
    @Override
    public boolean sendTransfer(String fromIban, String toIban, BigDecimal amount, String description) {
        System.out.println("[MOCK SWIFT/RTGS GATEWAY] Settling clearing transaction:");
        System.out.println("  From: " + fromIban);
        System.out.println("  To: " + toIban);
        System.out.println("  Amount: " + amount);
        System.out.println("  Description: " + description);
        return true;
    }
}
