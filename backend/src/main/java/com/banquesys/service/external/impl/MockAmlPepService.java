package com.banquesys.service.external.impl;

import com.banquesys.service.external.AmlPepService;
import org.springframework.stereotype.Service;

@Service
public class MockAmlPepService implements AmlPepService {
    @Override
    public boolean isSanctionedOrPep(String nom, String prenom, String numeroPasseport) {
        String fullName = (prenom + " " + nom).toLowerCase();
        return fullName.contains("sanction") || fullName.contains("pep") || "BK999999".equals(numeroPasseport);
    }
}
