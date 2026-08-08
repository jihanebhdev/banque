package com.banquesys.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationFix {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixConstraints() {
        try {
            // Drop the NOT NULL constraint on compte_destination_id if it exists
            jdbcTemplate.execute("ALTER TABLE operation ALTER COLUMN compte_destination_id DROP NOT NULL");
            System.out.println("[DB FIX] Dropped NOT NULL constraint on operation.compte_destination_id");
        } catch (Exception e) {
            System.out.println("[DB FIX] Could not drop constraint (it might have already been dropped or table doesn't exist yet): " + e.getMessage());
        }
        
        try {
            jdbcTemplate.execute("ALTER TABLE operation ALTER COLUMN compte_source_id DROP NOT NULL");
            System.out.println("[DB FIX] Dropped NOT NULL constraint on operation.compte_source_id");
        } catch (Exception e) {
            System.out.println("[DB FIX] Could not drop constraint: " + e.getMessage());
        }
    }
}
