package com.banquesys.service.external.impl;

import com.banquesys.model.Devise;
import com.banquesys.service.external.ExchangeRateService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@ConditionalOnProperty(name = "banquesys.service.exchangerate", havingValue = "constant", matchIfMissing = true)
public class ConstantExchangeRateService implements ExchangeRateService {

    @Override
    public BigDecimal getRate(Devise source, Devise destination) {
        if (source == destination) {
            return BigDecimal.ONE;
        }

        BigDecimal sourceInEur = getEurValueForOneUnit(source);
        BigDecimal destInEur = getEurValueForOneUnit(destination);

        // Result is sourceInEur / destInEur
        // Example: USD to MAD: sourceInEur = 1/1.1 = 0.909, destInEur = 1/11 = 0.0909 -> 0.909/0.0909 = 10.0
        return sourceInEur.divide(destInEur, 6, RoundingMode.HALF_UP);
    }

    private BigDecimal getEurValueForOneUnit(Devise dev) {
        switch (dev) {
            case EUR:
                return BigDecimal.ONE;
            case USD:
                // 1 EUR = 1.1 USD => 1 USD = 1/1.1 EUR
                return BigDecimal.ONE.divide(BigDecimal.valueOf(1.1), 6, RoundingMode.HALF_UP);
            case MAD:
                // 1 EUR = 11.0 MAD => 1 MAD = 1/11 EUR
                return BigDecimal.ONE.divide(BigDecimal.valueOf(11.0), 6, RoundingMode.HALF_UP);
            default:
                return BigDecimal.ONE;
        }
    }
}
