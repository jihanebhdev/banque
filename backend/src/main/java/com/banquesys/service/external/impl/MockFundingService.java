package com.banquesys.service.external.impl;

import com.banquesys.service.external.FundingService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
@ConditionalOnProperty(name = "banquesys.service.funding", havingValue = "mock", matchIfMissing = true)
public class MockFundingService implements FundingService {
    @Override
    public boolean processPayment(BigDecimal amount, String currency, String paymentMethodId) {
        System.out.println("[MOCK] processPayment processed successfully for amount " + amount + " " + currency);
        return true;
    }

    @Override
    public boolean processCardPayment(BigDecimal amount, String currency, String cardNumber, String expMonth, String expYear, String cvc) {
        System.out.println("[MOCK] processCardPayment processed successfully for amount " + amount + " " + currency + " using card ending in " + (cardNumber.length() > 4 ? cardNumber.substring(cardNumber.length() - 4) : cardNumber));
        return true;
    }
}
