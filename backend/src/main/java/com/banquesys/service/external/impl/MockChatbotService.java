package com.banquesys.service.external.impl;

import com.banquesys.service.external.ChatbotService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "banquesys.service.chatbot", havingValue = "mock", matchIfMissing = true)
public class MockChatbotService implements ChatbotService {
    @Override
    public String ask(String message, Long clientId, List<Map<String, String>> history) {
        String msgLower = message.toLowerCase();
        if (msgLower.contains("solde") || msgLower.contains("balance")) {
            return "Bonjour 🏦, votre solde de compte principal est simulé à 5,000.00 EUR dans cette session de démonstration.";
        }
        if (msgLower.contains("carte") || msgLower.contains("card")) {
            return "Vous pouvez gérer vos cartes bancaires en toute autonomie depuis votre espace personnel.";
        }
        return "Bonjour ! Je suis votre conseiller BanqueSys virtuel en mode d'évaluation locale. Comment puis-je vous aider aujourd'hui ? 💳";
    }
}
