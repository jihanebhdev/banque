package com.banquesys.service.external;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TreasuryForecastService {
    
    public static class ForecastPoint {
        private final LocalDate date;
        private final BigDecimal projectedBalance;

        public ForecastPoint(LocalDate date, BigDecimal projectedBalance) {
            this.date = date;
            this.projectedBalance = projectedBalance;
        }

        public LocalDate getDate() { return date; }
        public BigDecimal getProjectedBalance() { return projectedBalance; }
    }

    List<ForecastPoint> get30DaysForecast(Long clientId);
}
