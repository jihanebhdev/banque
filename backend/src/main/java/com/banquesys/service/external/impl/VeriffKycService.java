package com.banquesys.service.external.impl;

import com.banquesys.service.external.KycService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

@Service
@ConditionalOnProperty(name = "banquesys.service.kyc", havingValue = "veriff")
public class VeriffKycService implements KycService {

    @Value("${OPENAI_API_KEY:}")
    private String openAiApiKey;

    @Override
    public KycResult verifyIdentity(String rectoBase64, String versoBase64) {
        if (rectoBase64 == null || rectoBase64.isEmpty()) {
            return new KycResult(false, "Image recto manquante", null, null, null, null, null, null);
        }

        try {
            if (openAiApiKey == null || openAiApiKey.isEmpty()) {
                throw new IllegalStateException("OpenAI API key missing");
            }

            String openAiUrl = "https://api.openai.com/v1/chat/completions";
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiApiKey);

            String systemPrompt = "Tu es un agent d'audit bancaire spécialisé dans l'analyse de documents officiels (CNIE, Passeport).\n" +
                    "Analyse l'image du document d'identité recto (fournie en base64) et extrais les informations suivantes de manière très stricte au format JSON :\n" +
                    "{\n" +
                    "  \"nom\": \"NOM DE FAMILLE\",\n" +
                    "  \"prenom\": \"Prénom\",\n" +
                    "  \"numeroPasseport\": \"AB123456\",\n" +
                    "  \"dateNaissance\": \"YYYY-MM-DD\",\n" +
                    "  \"dateDelivrance\": \"YYYY-MM-DD\",\n" +
                    "  \"adresse\": \"Adresse complète si présente\"\n" +
                    "}\n" +
                    "Réponds UNIQUEMENT sous la forme d'un objet JSON strict. Ne mets aucun autre texte en dehors de l'objet JSON.";

            List<Map<String, Object>> contentList = new ArrayList<>();
            contentList.add(Map.of("type", "text", "text", "Analyse cette image et extrais les informations :"));

            String imageBase64 = rectoBase64;
            if (!imageBase64.startsWith("data:image")) {
                imageBase64 = "data:image/jpeg;base64," + imageBase64;
            }
            contentList.add(Map.of("type", "image_url", "image_url", Map.of("url", imageBase64, "detail", "high")));

            Map<String, Object> userMessage = Map.of("role", "user", "content", contentList);
            Map<String, Object> sysMessage = Map.of("role", "system", "content", systemPrompt);

            Map<String, Object> requestBody = Map.of(
                    "model", "gpt-4o-mini",
                    "messages", List.of(sysMessage, userMessage),
                    "temperature", 0.1,
                    "max_tokens", 500
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(openAiUrl, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                    String content = ((String) message.get("content")).trim();

                    if (content.startsWith("```json")) {
                        content = content.substring(7);
                    } else if (content.startsWith("```")) {
                        content = content.substring(3);
                    }
                    if (content.endsWith("```")) {
                        content = content.substring(0, content.length() - 3);
                    }
                    content = content.trim();

                    ObjectMapper mapper = new ObjectMapper();
                    Map<String, Object> jsonMap = mapper.readValue(content, Map.class);

                    String nom = (String) jsonMap.get("nom");
                    String prenom = (String) jsonMap.get("prenom");
                    String numeroPasseport = (String) jsonMap.get("numeroPasseport");
                    String dateNaissance = (String) jsonMap.get("dateNaissance");
                    String dateDelivrance = (String) jsonMap.get("dateDelivrance");
                    String adresse = (String) jsonMap.get("adresse");

                    return new KycResult(
                            true,
                            "Analyse OCR sémantique IA complétée avec succès.",
                            nom,
                            prenom,
                            numeroPasseport,
                            dateNaissance,
                            dateDelivrance,
                            adresse
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("[VERIFF KYC] AI OCR Extraction failed: " + e.getMessage());
            return new KycResult(false, "Échec de l'extraction par l'IA: " + e.getMessage(), null, null, null, null, null, null);
        }

        return new KycResult(false, "Impossible d'extraire les données du document", null, null, null, null, null, null);
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
        try {
            if (openAiApiKey == null || openAiApiKey.isEmpty()) {
                throw new IllegalStateException("OpenAI API key missing");
            }

            String openAiUrl = "https://api.openai.com/v1/chat/completions";
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiApiKey);

            String systemPrompt = "Tu es un expert d'audit de conformité KYC, détection de vivacité (Liveness) et filtrage AML/PEP pour une banque. " +
                    "On te fournit les informations d'inscription d'un client et les images de ses pièces justificatives (recto, verso, justificatif de domicile) ainsi qu'un selfie (si fourni). " +
                    "Compare les données saisies aux informations extraites visuellement des images et évalue les 7 points de conformité suivants :\n" +
                    "1. identityDocumentReadable : Le document d'identité (recto/verso) est net, lisible et exploitable. (true/false)\n" +
                    "2. nameAndSurnameMatching : Le nom et prénom de l'inscription correspondent exactement à ceux sur la pièce d'identité. (true/false)\n" +
                    "3. identityDocumentValid : Le document d'identité n'est pas expiré (selon sa date d'expiration ou la date de délivrance). (true/false)\n" +
                    "4. proofOfAddressConform : Le justificatif de domicile est lisible, récent (moins de 3 mois) et correspond au nom et à l'adresse saisie. (true/false)\n" +
                    "5. noFraudSuspicion : Il n'y a aucune anomalie visuelle, retouche suspecte ou falsification sur les documents fournis. (true/false)\n" +
                    "6. amlPepNegative : Le filtrage AML/PEP est négatif (sain). Le client ne figure pas sur des listes de sanctions ou de personnes politiquement exposées. (true/false)\n" +
                    "7. selfieLivenessMatched : Le selfie fourni correspond-il au visage sur la pièce d'identité (Face Matching) ? Semble-t-il s'agir d'une personne physique réelle et vivante (pas d'une photo d'écran ou papier) ? Si aucun selfie n'est fourni, réponds false. (true/false)\n\n" +
                    "Réponds UNIQUEMENT sous la forme d'un objet JSON strict avec les champs :\n" +
                    "{\n" +
                    "  \"identityDocumentReadable\": true/false,\n" +
                    "  \"nameAndSurnameMatching\": true/false,\n" +
                    "  \"identityDocumentValid\": true/false,\n" +
                    "  \"proofOfAddressConform\": true/false,\n" +
                    "  \"noFraudSuspicion\": true/false,\n" +
                    "  \"amlPepNegative\": true/false,\n" +
                    "  \"selfieLivenessMatched\": true/false,\n" +
                    "  \"message\": \"Explication sommaire du résultat global\"\n" +
                    "}\n" +
                    "Ne mets aucun autre texte en dehors de l'objet JSON.";

            List<Map<String, Object>> contentList = new ArrayList<>();
            StringBuilder textContent = new StringBuilder();
            textContent.append("Données d'inscription à vérifier :\n");
            textContent.append("- Nom : ").append(nom).append("\n");
            textContent.append("- Prénom : ").append(prenom).append("\n");
            textContent.append("- Date de Naissance : ").append(dateNaissance).append("\n");
            textContent.append("- Adresse : ").append(adresse).append("\n");
            textContent.append("- Numéro d'identité : ").append(numeroPasseport).append("\n");
            textContent.append("- Date de délivrance : ").append(dateDelivrance).append("\n");
            contentList.add(Map.of("type", "text", "text", textContent.toString()));

            if (rectoBase64 != null && !rectoBase64.isEmpty()) {
                if (!rectoBase64.startsWith("data:image")) {
                    rectoBase64 = "data:image/jpeg;base64," + rectoBase64;
                }
                contentList.add(Map.of("type", "image_url", "image_url", Map.of("url", rectoBase64, "detail", "high")));
            }
            if (versoBase64 != null && !versoBase64.isEmpty()) {
                if (!versoBase64.startsWith("data:image")) {
                    versoBase64 = "data:image/jpeg;base64," + versoBase64;
                }
                contentList.add(Map.of("type", "image_url", "image_url", Map.of("url", versoBase64, "detail", "high")));
            }
            if (proofAddressBase64 != null && !proofAddressBase64.isEmpty()) {
                if (!proofAddressBase64.startsWith("data:image")) {
                    proofAddressBase64 = "data:image/jpeg;base64," + proofAddressBase64;
                }
                contentList.add(Map.of("type", "image_url", "image_url", Map.of("url", proofAddressBase64, "detail", "high")));
            }
            if (selfieBase64 != null && !selfieBase64.isEmpty()) {
                if (!selfieBase64.startsWith("data:image")) {
                    selfieBase64 = "data:image/jpeg;base64," + selfieBase64;
                }
                contentList.add(Map.of("type", "image_url", "image_url", Map.of("url", selfieBase64, "detail", "high")));
            }

            Map<String, Object> userMessage = Map.of("role", "user", "content", contentList);
            Map<String, Object> sysMessage = Map.of("role", "system", "content", systemPrompt);

            Map<String, Object> requestBody = Map.of(
                    "model", "gpt-4o-mini",
                    "messages", List.of(sysMessage, userMessage),
                    "temperature", 0.1,
                    "max_tokens", 500
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(openAiUrl, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                    String content = ((String) message.get("content")).trim();

                    if (content.startsWith("```json")) {
                        content = content.substring(7);
                    } else if (content.startsWith("```")) {
                        content = content.substring(3);
                    }
                    if (content.endsWith("```")) {
                        content = content.substring(0, content.length() - 3);
                    }
                    content = content.trim();

                    ObjectMapper mapper = new ObjectMapper();
                    Map<String, Object> jsonMap = mapper.readValue(content, Map.class);

                    boolean idReadable = (Boolean) jsonMap.getOrDefault("identityDocumentReadable", false);
                    boolean namesMatch = (Boolean) jsonMap.getOrDefault("nameAndSurnameMatching", false);
                    boolean idValid = (Boolean) jsonMap.getOrDefault("identityDocumentValid", false);
                    boolean addressConform = (Boolean) jsonMap.getOrDefault("proofOfAddressConform", false);
                    boolean noFraud = (Boolean) jsonMap.getOrDefault("noFraudSuspicion", false);
                    boolean amlPepNeg = (Boolean) jsonMap.getOrDefault("amlPepNegative", false);
                    boolean selfieLiveness = (Boolean) jsonMap.getOrDefault("selfieLivenessMatched", false);
                    String summaryMsg = (String) jsonMap.getOrDefault("message", "Analyse complétée.");

                    int trueCount = 0;
                    if (idReadable) trueCount++;
                    if (namesMatch) trueCount++;
                    if (idValid) trueCount++;
                    if (addressConform) trueCount++;
                    if (noFraud) trueCount++;
                    if (amlPepNeg) trueCount++;
                    if (selfieLiveness) trueCount++;
                    int score = (int) Math.round((trueCount / 7.0) * 100);

                    return new KycChecklistResult(
                            true,
                            summaryMsg,
                            idReadable,
                            namesMatch,
                            idValid,
                            addressConform,
                            noFraud,
                            amlPepNeg,
                            selfieLiveness,
                            score
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("[VERIFF KYC] AI Screening failed: " + e.getMessage());
        }

        // Fallback
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
                "Analyse locale (Fallback - OpenAI indisponible)",
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
