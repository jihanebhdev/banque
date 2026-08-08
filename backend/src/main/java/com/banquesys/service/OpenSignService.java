package com.banquesys.service;

import com.banquesys.model.Client;

public interface OpenSignService {
    String createEnvelope(Client client, String contractContent);
}
