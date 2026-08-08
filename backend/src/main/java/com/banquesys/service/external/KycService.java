package com.banquesys.service.external;

public interface KycService {
    
    public static class KycResult {
        private final boolean success;
        private final String message;
        private final String extractedNom;
        private final String extractedPrenom;
        private final String extractedIdNumber;
        private final String extractedDateNaissance;
        private final String extractedDateDelivrance;
        private final String extractedAdresse;

        public KycResult(boolean success, String message, String extractedNom, String extractedPrenom, String extractedIdNumber,
                         String extractedDateNaissance, String extractedDateDelivrance, String extractedAdresse) {
            this.success = success;
            this.message = message;
            this.extractedNom = extractedNom;
            this.extractedPrenom = extractedPrenom;
            this.extractedIdNumber = extractedIdNumber;
            this.extractedDateNaissance = extractedDateNaissance;
            this.extractedDateDelivrance = extractedDateDelivrance;
            this.extractedAdresse = extractedAdresse;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public String getExtractedNom() { return extractedNom; }
        public String getExtractedPrenom() { return extractedPrenom; }
        public String getExtractedIdNumber() { return extractedIdNumber; }
        public String getExtractedDateNaissance() { return extractedDateNaissance; }
        public String getExtractedDateDelivrance() { return extractedDateDelivrance; }
        public String getExtractedAdresse() { return extractedAdresse; }
    }

    public static class KycChecklistResult {
        private final boolean success;
        private final String message;
        private final boolean identityDocumentReadable;
        private final boolean nameAndSurnameMatching;
        private final boolean identityDocumentValid;
        private final boolean proofOfAddressConform;
        private final boolean noFraudSuspicion;
        private final boolean amlPepNegative;
        private final boolean selfieLivenessMatched;
        private final int conformityScore;

        public KycChecklistResult(boolean success, String message, boolean identityDocumentReadable,
                                  boolean nameAndSurnameMatching, boolean identityDocumentValid,
                                  boolean proofOfAddressConform, boolean noFraudSuspicion,
                                  boolean amlPepNegative, boolean selfieLivenessMatched, int conformityScore) {
            this.success = success;
            this.message = message;
            this.identityDocumentReadable = identityDocumentReadable;
            this.nameAndSurnameMatching = nameAndSurnameMatching;
            this.identityDocumentValid = identityDocumentValid;
            this.proofOfAddressConform = proofOfAddressConform;
            this.noFraudSuspicion = noFraudSuspicion;
            this.amlPepNegative = amlPepNegative;
            this.selfieLivenessMatched = selfieLivenessMatched;
            this.conformityScore = conformityScore;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public boolean isIdentityDocumentReadable() { return identityDocumentReadable; }
        public boolean isNameAndSurnameMatching() { return nameAndSurnameMatching; }
        public boolean isIdentityDocumentValid() { return identityDocumentValid; }
        public boolean isProofOfAddressConform() { return proofOfAddressConform; }
        public boolean isNoFraudSuspicion() { return noFraudSuspicion; }
        public boolean isAmlPepNegative() { return amlPepNegative; }
        public boolean isSelfieLivenessMatched() { return selfieLivenessMatched; }
        public int getConformityScore() { return conformityScore; }
    }

    KycResult verifyIdentity(String rectoBase64, String versoBase64);

    KycChecklistResult verifyCompliance(
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
    );
}
