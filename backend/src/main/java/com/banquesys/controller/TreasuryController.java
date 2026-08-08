package com.banquesys.controller;

import com.banquesys.security.UserDetailsImpl;
import com.banquesys.service.external.TreasuryForecastService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/treasury")
public class TreasuryController {

    @Autowired
    private TreasuryForecastService treasuryForecastService;

    @GetMapping("/forecast")
    public ResponseEntity<?> getForecast() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<TreasuryForecastService.ForecastPoint> forecast = treasuryForecastService.get30DaysForecast(userDetails.getId());
        return ResponseEntity.ok(forecast);
    }
}
