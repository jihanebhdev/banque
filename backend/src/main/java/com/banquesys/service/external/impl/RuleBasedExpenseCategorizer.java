package com.banquesys.service.external.impl;

import com.banquesys.service.external.ExpenseCategorizerService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "banquesys.service.categorizer", havingValue = "rule", matchIfMissing = true)
public class RuleBasedExpenseCategorizer implements ExpenseCategorizerService {

    @Override
    public String categorize(String description) {
        if (description == null || description.isEmpty()) {
            return "Divers";
        }
        String desc = description.toLowerCase();
        if (desc.contains("electricite") || desc.contains("eau") || desc.contains("lydec") || desc.contains("radeema") || desc.contains("facture")) {
            return "Énergie / Factures";
        }
        if (desc.contains("internet") || desc.contains("iam") || desc.contains("orange") || desc.contains("inwi") || desc.contains("telecom") || desc.contains("abonnement")) {
            return "Télécom / Abonnement";
        }
        if (desc.contains("carrefour") || desc.contains("marjane") || desc.contains("bim") || desc.contains("supermarche") || desc.contains("epicerie")) {
            return "Alimentation";
        }
        if (desc.contains("uber") || desc.contains("careem") || desc.contains("tram") || desc.contains("train") || desc.contains("oncf") || desc.contains("carburant") || desc.contains("autoroute")) {
            return "Transport";
        }
        if (desc.contains("resto") || desc.contains("cafe") || desc.contains("mcdonald") || desc.contains("starbucks") || desc.contains("netflix") || desc.contains("cinema")) {
            return "Restauration / Loisirs";
        }
        if (desc.contains("salaire") || desc.contains("virement recu") || desc.contains("depot")) {
            return "Revenus";
        }
        return "Divers";
    }
}
