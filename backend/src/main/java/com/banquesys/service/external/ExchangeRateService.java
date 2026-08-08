package com.banquesys.service.external;

import com.banquesys.model.Devise;
import java.math.BigDecimal;

public interface ExchangeRateService {
    BigDecimal getRate(Devise source, Devise destination);
}
