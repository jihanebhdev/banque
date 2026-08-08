package com.banquesys.service.external.chatbot;

import com.banquesys.model.Utilisateur;
import com.banquesys.model.Client;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AnonymizationService {

    /**
     * Prepares anonymization maps and obfuscates basic profile details.
     */
    public Map<String, String> buildReplacementsMap(Utilisateur user) {
        Map<String, String> replacements = new HashMap<>();
        if (user != null) {
            String fullName = user.getPrenom() + " " + user.getNom();
            replacements.put(fullName, "[NOM_CLIENT]");
            replacements.put(user.getNom(), "[NOM]");
            replacements.put(user.getPrenom(), "[PRENOM]");
            if (user.getEmail() != null) {
                replacements.put(user.getEmail(), "[EMAIL]");
            }
            if (user instanceof Client) {
                Client client = (Client) user;
                if (client.getTelephone() != null) {
                    replacements.put(client.getTelephone(), "[TELEPHONE]");
                }
            }
        }
        return replacements;
    }

    /**
     * Anonymizes an IBAN and registers it in the replacements map.
     */
    public String anonymizeIban(String iban, Map<String, String> replacements, String label) {
        if (iban == null || iban.trim().isEmpty()) {
            return "";
        }
        String cleanIban = iban.replaceAll("\\s+", "");
        if (replacements.containsKey(cleanIban)) {
            return replacements.get(cleanIban);
        }
        replacements.put(cleanIban, label);
        replacements.put(iban, label);
        return label;
    }

    /**
     * Anonymizes arbitrary text using the replacements map.
     */
    public String anonymizeText(String text, Map<String, String> replacements) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        String result = text;
        
        // Obfuscate standard patterns like emails and Moroccan/international phone numbers
        result = result.replaceAll("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", "[EMAIL]");
        result = result.replaceAll("(?:\\+212|0)[5-7]\\d{8}", "[TELEPHONE]");
        
        // Obfuscate any IBAN patterns
        Pattern ibanPattern = Pattern.compile("\\b[A-Z]{2}\\d{2}[A-Z0-9]{11,30}\\b", Pattern.CASE_INSENSITIVE);
        Matcher matcher = ibanPattern.matcher(result);
        int accountIndex = 1;
        while (matcher.find()) {
            String foundIban = matcher.group();
            String label = "[COMPTE_" + (char)('A' + (accountIndex - 1)) + "]";
            replacements.put(foundIban, label);
            result = result.replace(foundIban, label);
            accountIndex++;
        }

        // Replace known user details
        for (Map.Entry<String, String> entry : replacements.entrySet()) {
            if (entry.getKey() != null && entry.getKey().length() > 2) {
                result = result.replace(entry.getKey(), entry.getValue());
            }
        }
        return result;
    }

    /**
     * Restores actual values from placeholders in the AI response.
     */
    public String deanonymizeText(String text, Map<String, String> replacements) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        String result = text;
        for (Map.Entry<String, String> entry : replacements.entrySet()) {
            if (entry.getValue() != null && entry.getValue().startsWith("[") && entry.getValue().endsWith("]")) {
                // Map placeholder (value) back to real data (key)
                result = result.replace(entry.getValue(), entry.getKey());
            }
        }
        return result;
    }
}
