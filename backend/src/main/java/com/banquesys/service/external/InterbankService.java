package com.banquesys.service.external;

import java.math.BigDecimal;

public interface InterbankService {
    boolean sendTransfer(String fromIban, String toIban, BigDecimal amount, String description);
}
