package com.banquesys.service.external.impl;

import com.banquesys.service.external.ExpenseCategorizerService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
@ConditionalOnProperty(name = "banquesys.service.categorizer", havingValue = "ai")
public class AiExpenseCategorizer implements ExpenseCategorizerService {

    @Value("${OPENAI_API_KEY:}")
    private String openAiApiKey;

    private final RuleBasedExpenseCategorizer fallback = new RuleBasedExpenseCategorizer();

    @Override
    public String categorize(String description) {
        if (description == null || description.isEmpty()) {
            return "Divers";
        }

        try {
            String openAiUrl = "https://api.openai.com/v1/chat/completions";
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiApiKey);

            String userPrompt = "Catégorise la transaction bancaire suivante : \"" + description + "\". " +
                    "Choisis uniquement parmi les valeurs : \"Alimentation\", \"Énergie / Factures\", \"Télécom / Abonnement\", \"Transport\", \"Restauration / Loisirs\", \"Revenus\", \"Divers\". " +
                    "Réponds avec le nom exact de la catégorie sélectionnée et absolument rien d'autre.";

            Map<String, Object> userMessage = Map.of("role", "user", "content", userPrompt);
            Map<String, Object> requestBody = Map.of(
                    "model", "gpt-4o-mini",
                    "messages", List.of(userMessage),
                    "temperature", 0.0,
                    "max_tokens", 50
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(openAiUrl, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    Map<String, String> replyMessage = (Map<String, String>) firstChoice.get("message");
                    String category = replyMessage.get("content").trim();
                    if (category.startsWith("\"") && category.endsWith("\"")) {
                        category = category.substring(1, category.length() - 1);
                    }
                    return category;
                }
            }
        } catch (Exception e) {
            System.err.println("[AI CATEGORIZER] Failed to categorize with OpenAI, using fallback: " + e.getMessage());
        }

        return fallback.categorize(description);
    }
}
