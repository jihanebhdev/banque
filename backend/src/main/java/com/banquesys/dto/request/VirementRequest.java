package com.banquesys.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class VirementRequest {
    private String ibanSource;
    private String ibanDestination;
    private BigDecimal montant;
    private String description;
}
