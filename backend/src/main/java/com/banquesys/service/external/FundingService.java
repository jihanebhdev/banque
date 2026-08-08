package com.banquesys.service.external;

import java.math.BigDecimal;

public interface FundingService {
    boolean processPayment(BigDecimal amount, String currency, String paymentMethodId);
    boolean processCardPayment(BigDecimal amount, String currency, String cardNumber, String expMonth, String expYear, String cvc);
}
