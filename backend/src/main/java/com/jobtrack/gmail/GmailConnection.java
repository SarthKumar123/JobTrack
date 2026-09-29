package com.jobtrack.gmail;

import jakarta.servlet.http.HttpSession;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;
import static org.springframework.http.HttpStatus.*;

@Service
public class GmailConnection {
    private static final String PENDING = "gmail.pending";
    private static final String ACCESS = "gmail.access";
    private final GmailClient client;
    private final String clientId;
    private final String clientSecret;
    private final String frontend;
    private final SecureRandom random = new SecureRandom();
    private record Pending(String owner, String state, String verifier, Instant expires) {}
    private record Access(String owner, String token, Instant expires) {}

    public GmailConnection(GmailClient client,
            @Value("${spring.security.oauth2.client.registration.google.client-id}") String clientId,
            @Value("${spring.security.oauth2.client.registration.google.client-secret}") String clientSecret,
            @Value("${app.frontend-url}") String frontend) {
        this.client = client;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.frontend = frontend.replaceAll("/+$", "");
    }

    public String begin(HttpSession session, String owner, String email) {
        String state = nonce(), verifier = nonce();
        session.setAttribute(PENDING, new Pending(owner, state, verifier, Instant.now().plusSeconds(600)));
        return UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", clientId).queryParam("redirect_uri", redirect())
                .queryParam("response_type", "code").queryParam("scope", "openid email " + GmailClient.SCOPE)
                .queryParam("state", state).queryParam("code_challenge", challenge(verifier))
                .queryParam("code_challenge_method", "S256").queryParam("access_type", "online")
                .queryParam("prompt", "consent").queryParam("login_hint", email)
                .build().encode().toUriString();
    }

    public String finish(HttpSession session, String owner, String state, String code, String error) {
        Pending pending;
        synchronized (session) {
            pending = (Pending) session.getAttribute(PENDING);
            session.removeAttribute(PENDING);
        }
        if (pending == null || !pending.owner().equals(owner) || state == null
                || !MessageDigest.isEqual(pending.state().getBytes(StandardCharsets.UTF_8), state.getBytes(StandardCharsets.UTF_8))
                || pending.expires().isBefore(Instant.now())) return result("expired");
        if (error != null || code == null) return result("denied");
        try {
            var tokens = client.exchange(code, pending.verifier(), clientId, clientSecret, redirect());
            if (tokens == null || tokens.access_token() == null || tokens.scope() == null
                    || !Arrays.asList(tokens.scope().split(" ")).contains(GmailClient.SCOPE)) return result("denied");
            var identity = client.identity(tokens.access_token());
            if (identity == null || !owner.equals(identity.sub())) return result("wrong-account");
            session.setAttribute(ACCESS, new Access(owner, tokens.access_token(),
                    Instant.now().plusSeconds(Math.max(0, tokens.expires_in() - 60))));
            return result("connected");
        } catch (RestClientException | IllegalArgumentException e) {
            return result("failed");
        }
    }

    public boolean connected(HttpSession session, String owner) {
        Access access = (Access) session.getAttribute(ACCESS);
        return access != null && access.owner().equals(owner) && access.expires().isAfter(Instant.now());
    }

    public String token(HttpSession session, String owner) {
        if (!connected(session, owner)) throw new ResponseStatusException(CONFLICT, "Connect Gmail to sync emails.");
        return ((Access) session.getAttribute(ACCESS)).token();
    }

    public void disconnect(HttpSession session) {
        session.removeAttribute(ACCESS);
        session.removeAttribute(PENDING);
    }

    private String redirect() { return frontend + "/api/gmail/callback"; }
    private String result(String status) { return frontend + "/?gmail=" + status; }
    private String nonce() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    private String challenge(String verifier) {
        try {
            return Base64.getUrlEncoder().withoutPadding().encodeToString(
                    MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is required", e);
        }
    }
}
