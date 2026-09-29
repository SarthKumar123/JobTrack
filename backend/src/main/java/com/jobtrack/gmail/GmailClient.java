package com.jobtrack.gmail;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Component
public class GmailClient {
    public static final String SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
    private final RestClient http;

    public GmailClient() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(15));
        http = RestClient.builder().requestFactory(factory).build();
    }

    GmailClient(RestClient http) { this.http = http; }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Tokens(String access_token, String scope, long expires_in) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Identity(String sub) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Header(String name, String value) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Payload(List<Header> headers) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Message(String id, String snippet, String internalDate, Payload payload) {
        public String header(String name) {
            if (payload == null || payload.headers() == null) return "";
            return payload.headers().stream().filter(h -> name.equalsIgnoreCase(h.name()))
                    .map(Header::value).findFirst().orElse("");
        }
    }
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Page(List<Message> messages, String nextPageToken) {}

    public Tokens exchange(String code, String verifier, String id, String secret, String redirect) {
        var form = new LinkedMultiValueMap<String, String>();
        Map.of("code", code, "code_verifier", verifier, "client_id", id,
                "client_secret", secret, "redirect_uri", redirect,
                "grant_type", "authorization_code").forEach(form::add);
        return http.post().uri("https://oauth2.googleapis.com/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form)
                .retrieve().body(Tokens.class);
    }

    public Identity identity(String token) {
        return http.get().uri("https://openidconnect.googleapis.com/v1/userinfo")
                .headers(h -> h.setBearerAuth(token)).retrieve().body(Identity.class);
    }

    public Page search(String token) {
        return get(http.get().uri(builder -> builder.scheme("https").host("gmail.googleapis.com")
                .path("/gmail/v1/users/me/messages")
                .queryParam("q", "{query}")
                .queryParam("maxResults", 50).build(Map.of("query",
                        "newer_than:30d -in:spam -in:trash -in:sent {application applying interview assessment offer unsuccessful rejected}"))), token, Page.class);
    }

    public Message message(String token, String id) {
        return get(http.get().uri(builder -> builder.scheme("https").host("gmail.googleapis.com")
                .path("/gmail/v1/users/me/messages/{id}").queryParam("format", "metadata")
                .queryParam("metadataHeaders", "Subject", "From")
                .queryParam("fields", "id,snippet,internalDate,payload/headers").build(id)), token, Message.class);
    }

    private <T> T get(RestClient.RequestHeadersSpec<?> request, String token, Class<T> type) {
        try {
            return request.headers(h -> h.setBearerAuth(token)).retrieve().body(type);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 401)
                throw new ResponseStatusException(CONFLICT, "Gmail access expired. Connect Gmail again.");
            if (e.getStatusCode().value() == 403)
                throw new ResponseStatusException(BAD_GATEWAY, "Enable Gmail API in Google Cloud and grant read-only access, then reconnect.");
            if (e.getStatusCode().value() == 429)
                throw new ResponseStatusException(TOO_MANY_REQUESTS, "Google's request limit was reached. Try again later.");
            throw new ResponseStatusException(BAD_GATEWAY, "Gmail could not be read. Try again later.");
        } catch (RestClientException e) {
            throw new ResponseStatusException(BAD_GATEWAY, "Could not reach Gmail. Try again later.");
        }
    }
}
