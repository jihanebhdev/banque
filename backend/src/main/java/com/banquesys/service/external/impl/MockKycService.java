package com.banquesys.service.external.impl;

import com.banquesys.service.external.KycService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "banquesys.service.kyc", havingValue = "mock", matchIfMissing = true)
public class MockKycService implements KycService {
    @Override
    public KycResult verifyIdentity(String rectoBase64, String versoBase64) {
        System.out.println("[MOCK KYC] Verifying identity locally.");
        return new KycResult(true, "Vérification locale réussie (Mock)", "MOCK_NOM", "MOCK_PRENOM", "BK123456", "1990-01-01", "2020-01-01", "123 Rue de la Poste, Paris");
    }

    @Override
    public KycChecklistResult verifyCompliance(
        String nom,
        String prenom,
        String dateNaissance,
        String adresse,
        String numeroPasseport,
        String dateDelivrance,
        String rectoBase64,
        String versoBase64,
        String proofAddressBase64,
        String selfieBase64
    ) {
        System.out.println("[MOCK KYC] Verifying compliance checklist locally.");
        
        boolean mockReadable = (rectoBase64 != null && !rectoBase64.isEmpty());
        boolean mockNamesMatch = (nom != null && !nom.isEmpty()) && (prenom != null && !prenom.isEmpty());
        boolean mockIdValid = true;
        boolean mockAddressConform = (proofAddressBase64 != null && !proofAddressBase64.isEmpty());
        boolean mockNoFraud = true;
        boolean mockAmlPepNeg = true;
        boolean mockSelfieLiveness = (selfieBase64 != null && !selfieBase64.isEmpty());

        if (nom != null && (nom.toLowerCase().contains("fraude") || nom.toLowerCase().contains("suspect"))) {
            mockNoFraud = false;
        }
        if (nom != null && (nom.toLowerCase().contains("sanction") || nom.toLowerCase().contains("pep"))) {
            mockAmlPepNeg = false;
        }

        int trueCount = 0;
        if (mockReadable) trueCount++;
        if (mockNamesMatch) trueCount++;
        if (mockIdValid) trueCount++;
        if (mockAddressConform) trueCount++;
        if (mockNoFraud) trueCount++;
        if (mockAmlPepNeg) trueCount++;
        if (mockSelfieLiveness) trueCount++;
        int score = (int) Math.round((trueCount / 7.0) * 100);

        return new KycChecklistResult(
            true,
            "Analyse locale simulée réussie (Mock)",
            mockReadable,
            mockNamesMatch,
            mockIdValid,
            mockAddressConform,
            mockNoFraud,
            mockAmlPepNeg,
            mockSelfieLiveness,
            score
        );
    }
}
