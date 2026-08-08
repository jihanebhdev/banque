package com.banquesys.controller;

import com.banquesys.model.GlobalConfig;
import com.banquesys.repository.GlobalConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Autowired
    private GlobalConfigRepository configRepository;

    @PostConstruct
    public void init() {
        if (configRepository.count() == 0) {
            GlobalConfig config = new GlobalConfig();
            config.setBankName("Banque Nationale");
            configRepository.save(config);
        }
    }

    @GetMapping("/public")
    public ResponseEntity<?> getConfig() {
        List<GlobalConfig> configs = configRepository.findAll();
        if (configs.isEmpty()) {
            GlobalConfig config = new GlobalConfig();
            config.setBankName("Banque Nationale");
            return ResponseEntity.ok(config);
        }
        return ResponseEntity.ok(configs.get(0));
    }

    @PutMapping("")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateConfig(@RequestBody GlobalConfig configRequest) {
        List<GlobalConfig> configs = configRepository.findAll();
        GlobalConfig config;
        if (configs.isEmpty()) {
            config = new GlobalConfig();
        } else {
            config = configs.get(0);
        }
        
        if (configRequest.getBankName() != null && !configRequest.getBankName().isEmpty()) {
            config.setBankName(configRequest.getBankName());
        }
        config.setLogoUrl(configRequest.getLogoUrl());
        
        configRepository.save(config);
        return ResponseEntity.ok(config);
    }
}
