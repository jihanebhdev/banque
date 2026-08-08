package com.banquesys.service.external.impl;

import com.banquesys.model.Compte;
import com.banquesys.model.Operation;
import com.banquesys.repository.CompteRepository;
import com.banquesys.repository.OperationRepository;
import com.banquesys.service.external.TreasuryForecastService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class LinearRegressionTreasuryForecastService implements TreasuryForecastService {

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private OperationRepository operationRepository;

    @Override
    public List<ForecastPoint> get30DaysForecast(Long clientId) {
        List<ForecastPoint> points = new ArrayList<>();
        List<Compte> comptes = compteRepository.findByClientId(clientId);
        if (comptes.isEmpty()) {
            return points;
        }

        Compte compte = comptes.get(0);
        BigDecimal currentBalance = compte.getSolde();

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Operation> operations = operationRepository.findByCompteSourceOrCompteDestinationOrderByDateOperationDesc(compte, compte);

        BigDecimal dailySlope = BigDecimal.ZERO;
        int totalDaysWithOps = 0;
        BigDecimal netSum = BigDecimal.ZERO;

        for (Operation op : operations) {
            if (op.getDateOperation().isAfter(thirtyDaysAgo)) {
                boolean isDebit = op.getCompteSource() != null && op.getCompteSource().getId().equals(compte.getId());
                BigDecimal amount = op.getMontant();
                if (isDebit) {
                    netSum = netSum.subtract(amount);
                } else {
                    netSum = netSum.add(amount);
                }
                totalDaysWithOps++;
            }
        }

        if (totalDaysWithOps > 0) {
            dailySlope = netSum.divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
        } else {
            dailySlope = BigDecimal.valueOf(-5.0);
        }

        LocalDate startDate = LocalDate.now();
        BigDecimal balance = currentBalance;

        for (int i = 1; i <= 30; i++) {
            LocalDate date = startDate.plusDays(i);
            balance = balance.add(dailySlope);

            if (date.getDayOfMonth() == 10) {
                balance = balance.subtract(BigDecimal.valueOf(30.00));
            }
            if (date.getDayOfMonth() == 20) {
                balance = balance.subtract(BigDecimal.valueOf(75.00));
            }
            if (date.getDayOfMonth() == 28) {
                balance = balance.add(BigDecimal.valueOf(1200.00));
            }

            points.add(new ForecastPoint(date, balance.setScale(2, RoundingMode.HALF_UP)));
        }

        return points;
    }
}
