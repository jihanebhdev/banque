package com.banquesys.controller;

import com.banquesys.dto.response.MessageResponse;
import com.banquesys.model.Message;
import com.banquesys.model.Utilisateur;
import com.banquesys.repository.MessageRepository;
import com.banquesys.repository.UtilisateurRepository;
import com.banquesys.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UtilisateurRepository userRepository;

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<?> getConversation(@PathVariable Long otherUserId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            Utilisateur currentUser = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("Utilisateur courant introuvable."));

            Utilisateur otherUser = userRepository.findById(otherUserId)
                    .orElseThrow(() -> new RuntimeException("Autre utilisateur introuvable."));

            List<Message> messages = messageRepository.findByExpediteurOrDestinataireOrderByDateEnvoiAsc(
                    otherUser, otherUser);

            List<Map<String, Object>> response = new ArrayList<>();
            for (Message m : messages) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", m.getId());
                map.put("senderId", m.getExpediteur().getId());
                map.put("receiverId", m.getDestinataire().getId());
                map.put("content", m.getContenu());
                map.put("timestamp", m.getDateEnvoi());
                map.put("senderName", m.getExpediteur().getPrenom() + " " + m.getExpediteur().getNom());
                map.put("senderAvatar", m.getExpediteur().getAvatar());
                response.add(map);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @GetMapping("/my-advisor-conversation")
    public ResponseEntity<?> getMyAdvisorConversation() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Utilisateur currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));

        // Find first admin or employe (used as fallback destination if client sends a message)
        Utilisateur advisor = userRepository.findByRole(com.banquesys.model.RoleType.ROLE_ADMIN).stream().findFirst()
            .orElseGet(() -> userRepository.findByRole(com.banquesys.model.RoleType.ROLE_EMPLOYE).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Aucun conseiller disponible.")));

        List<Message> messages = messageRepository.findByExpediteurOrDestinataireOrderByDateEnvoiAsc(
                currentUser, currentUser);

        List<Map<String, Object>> messagesList = new ArrayList<>();
        for (Message m : messages) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("senderId", m.getExpediteur().getId());
            map.put("receiverId", m.getDestinataire().getId());
            map.put("content", m.getContenu());
            map.put("timestamp", m.getDateEnvoi());
            map.put("senderName", m.getExpediteur().getPrenom() + " " + m.getExpediteur().getNom());
            map.put("senderAvatar", m.getExpediteur().getAvatar());
            messagesList.add(map);
        }

        Map<String, Object> advisorInfo = new HashMap<>();
        advisorInfo.put("id", advisor.getId());
        advisorInfo.put("nom", advisor.getNom());
        advisorInfo.put("prenom", advisor.getPrenom());
        advisorInfo.put("avatar", advisor.getAvatar());
        advisorInfo.put("role", advisor.getRole().name());

        Map<String, Object> response = new HashMap<>();
        response.put("messages", messagesList);
        response.put("advisor", advisorInfo);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/send-to-advisor")
    public ResponseEntity<?> sendToAdvisor(@RequestBody Map<String, Object> payload) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Utilisateur currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));

        Utilisateur advisor = userRepository.findByRole(com.banquesys.model.RoleType.ROLE_ADMIN).stream().findFirst()
            .orElseGet(() -> userRepository.findByRole(com.banquesys.model.RoleType.ROLE_EMPLOYE).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Aucun conseiller disponible.")));

        String contenu = (String) payload.get("contenu");
        Message message = new Message(currentUser, advisor, contenu);
        messageRepository.save(message);

        Map<String, Object> map = new HashMap<>();
        map.put("id", message.getId());
        map.put("senderId", message.getExpediteur().getId());
        map.put("receiverId", message.getDestinataire().getId());
        map.put("content", message.getContenu());
        map.put("timestamp", message.getDateEnvoi());

        return ResponseEntity.ok(map);
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> payload) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Utilisateur expediteur = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur courant introuvable."));

        Long destinataireId = Long.valueOf(payload.get("destinataireId").toString());
        String contenu = (String) payload.get("contenu");

        Utilisateur destinataire = userRepository.findById(destinataireId)
                .orElseThrow(() -> new RuntimeException("Destinataire introuvable."));

        Message message = new Message(expediteur, destinataire, contenu);
        messageRepository.save(message);

        Map<String, Object> map = new HashMap<>();
        map.put("id", message.getId());
        map.put("senderId", message.getExpediteur().getId());
        map.put("receiverId", message.getDestinataire().getId());
        map.put("content", message.getContenu());
        map.put("timestamp", message.getDateEnvoi());

        return ResponseEntity.ok(map);
    }
}
