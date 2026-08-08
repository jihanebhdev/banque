package com.banquesys.service.external;

import java.util.List;
import java.util.Map;

public interface ChatbotService {
    String ask(String message, Long clientId, List<Map<String, String>> history);
}
