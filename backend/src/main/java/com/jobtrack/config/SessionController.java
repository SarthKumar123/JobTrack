package com.jobtrack.config;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SessionController {
    @GetMapping("/api/csrf")
    public CsrfResponse csrf(CsrfToken token) {
        return new CsrfResponse(token.getHeaderName(), token.getToken());
    }

    @GetMapping("/api/me")
    public Profile me(@AuthenticationPrincipal OidcUser user) {
        return new Profile(user.getFullName(), user.getEmail());
    }

    public record CsrfResponse(String headerName, String token) {}
    public record Profile(String name, String email) {}
}
