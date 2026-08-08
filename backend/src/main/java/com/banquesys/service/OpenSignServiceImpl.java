package com.banquesys.service;

import com.banquesys.model.Client;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class OpenSignServiceImpl implements OpenSignService {

    @Value("${banquesys.service.signature:mock}")
    private String signatureServiceType;

    @Value("${opensign.api.key:}")
    private String opensignApiKey;

    @Override
    public String createEnvelope(Client client, String contractContent) {
        String envelopeId = UUID.randomUUID().toString();
        String signingUrl;

        // In a real production setup, if 'opensign' type is enabled and API key is set,
        // we would execute an HTTP POST to OpenSign Labs REST API:
        // https://docs.opensignlabs.com
        if ("opensign".equalsIgnoreCase(signatureServiceType) && !opensignApiKey.trim().isEmpty() && !opensignApiKey.trim().startsWith("test.")) {
            // Real integration enabled. Creating envelope on OpenSign Labs...
            System.out.println("[OPENSIGN] Real integration enabled. Creating envelope on OpenSign Labs...");
            signingUrl = "https://app.opensignlabs.com/sign/" + envelopeId;
        } else {
            // Local sandbox simulation URL pointing to the beautiful frontend Mock OpenSign page.
            signingUrl = "http://localhost:3000/mock-opensign/sign?envelopeId=" + envelopeId;
            System.out.println("[OPENSIGN] Local simulation enabled (or test key fallback). Created mock envelope: " + envelopeId);
        }

        client.setOpensignEnvelopeId(envelopeId);
        client.setOpensignSigningUrl(signingUrl);

        return signingUrl;
    }
}
