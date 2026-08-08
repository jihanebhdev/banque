package com.banquesys.dto.request;

import lombok.Data;

@Data
public class SignupRequest {
    private String nom;
    private String prenom;
    private String email;
    private String password;
    
    // We can allow users to specify a role during registration for testing purposes,
    // though in a real app, standard users would default to CLIENT.
    private String role; 
}
