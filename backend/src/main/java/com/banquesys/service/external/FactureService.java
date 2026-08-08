package com.banquesys.service.external;

import com.banquesys.model.Facture;
import java.util.List;

public interface FactureService {
    List<Facture> getFacturesByClientId(Long clientId);
    Facture payFacture(Long factureId, Long clientId);
}
