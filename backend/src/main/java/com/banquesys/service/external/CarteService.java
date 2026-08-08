package com.banquesys.service.external;

import com.banquesys.model.Carte;
import com.banquesys.model.Compte;
import java.math.BigDecimal;
import java.util.List;

public interface CarteService {
    List<Carte> getCardsByClientId(Long clientId);
    Carte orderCard(Compte compte, String type, String stripeColor, String pin);
    Carte toggleBlockCard(Long cardId, Long clientId);
    void updatePin(Long cardId, Long clientId, String newPin);
    Carte updateLimits(Long cardId, Long clientId, BigDecimal paymentLimit, BigDecimal withdrawLimit);
}
