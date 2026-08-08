package com.banquesys.service.external.impl;

import com.banquesys.model.Devise;
import com.banquesys.service.external.ExchangeRateService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "banquesys.service.exchangerate", havingValue = "api")
public class ApiExchangeRateService implements ExchangeRateService {

    private final ConstantExchangeRateService fallback = new ConstantExchangeRateService();

    @Override
    public BigDecimal getRate(Devise source, Devise destination) {
        if (source == destination) {
            return BigDecimal.ONE;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.getForEntity("https://open.er-api.com/v6/latest/EUR", Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> rates = (Map<String, Object>) response.getBody().get("rates");
                if (rates != null) {
                    Number sourceRateNum = (Number) rates.get(source.name());
                    Number destRateNum = (Number) rates.get(destination.name());
                    
                    if (sourceRateNum != null && destRateNum != null) {
                        BigDecimal sourceRate = BigDecimal.valueOf(sourceRateNum.doubleValue());
                        BigDecimal destRate = BigDecimal.valueOf(destRateNum.doubleValue());

                        return destRate.divide(sourceRate, 6, RoundingMode.HALF_UP);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[FX RATE API] Failed to fetch rates from API, using fallback: " + e.getMessage());
        }

        return fallback.getRate(source, destination);
    }
}
