package com.banquesys.service.external;

public interface AmlPepService {
    boolean isSanctionedOrPep(String nom, String prenom, String numeroPasseport);
}
