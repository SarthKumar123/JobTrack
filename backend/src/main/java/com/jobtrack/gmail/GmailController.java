package com.jobtrack.gmail;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ProblemDetail;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.jobtrack.workspace.ApiModels.ApplicationView;
import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/gmail")
public class GmailController {
    private final GmailConnection connection;
    private final GmailClient client;
    private final SuggestionService suggestions;
    public GmailController(GmailConnection connection, GmailClient client, SuggestionService suggestions) {
        this.connection = connection;
        this.client = client;
        this.suggestions = suggestions;
    }
    @ExceptionHandler(ResponseStatusException.class)
    ProblemDetail requestFailed(ResponseStatusException exception) {
        return ProblemDetail.forStatusAndDetail(exception.getStatusCode(),
                exception.getReason() == null ? "Request could not be completed." : exception.getReason());
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail duplicateSync() {
        return ProblemDetail.forStatusAndDetail(CONFLICT, "Another sync completed. Reload your suggestions.");
    }
    public record Status(boolean connected, List<SuggestionService.View> suggestions) {}
    public record SyncResult(int added, boolean limited) {}
    @GetMapping
    public Status status(@AuthenticationPrincipal OidcUser user, HttpSession session) {
        return new Status(connection.connected(session, user.getSubject()), suggestions.pending(user.getSubject()));
    }
    @PostMapping("/connect")
    public Map<String, String> connect(@AuthenticationPrincipal OidcUser user, HttpSession session) {
        return Map.of("url", connection.begin(session, user.getSubject(), user.getEmail()));
    }
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(@AuthenticationPrincipal OidcUser user, HttpSession session,
            @RequestParam(required = false) String state, @RequestParam(required = false) String code,
            @RequestParam(required = false) String error) {
        return ResponseEntity.status(303).location(URI.create(connection.finish(session,
                user.getSubject(), state, code, error))).build();
    }
    @PostMapping("/sync")
    public SyncResult sync(@AuthenticationPrincipal OidcUser user, HttpSession session) {
        synchronized (session) {
            Instant last = (Instant) session.getAttribute("gmail.lastSync");
            if (last != null && last.plusSeconds(60).isAfter(Instant.now()))
                throw new ResponseStatusException(TOO_MANY_REQUESTS, "Wait one minute between syncs.");
            String token = connection.token(session, user.getSubject());
            session.setAttribute("gmail.lastSync", Instant.now());
            var page = client.search(token);
            var messages = new ArrayList<GmailClient.Message>();
            if (page != null && page.messages() != null) {
                for (var message : page.messages().stream().limit(50).toList())
                    messages.add(client.message(token, message.id()));
            }
            return new SyncResult(suggestions.ingest(user.getSubject(), messages),
                    page != null && page.nextPageToken() != null);
        }
    }
    @PostMapping("/suggestions/{id}/approve")
    public ApplicationView approve(@AuthenticationPrincipal OidcUser user, @PathVariable String id,
            @Valid @RequestBody SuggestionService.Approval input) {
        return suggestions.approve(user.getSubject(), id, input);
    }
    @PostMapping("/suggestions/{id}/dismiss")
    @ResponseStatus(NO_CONTENT)
    public void dismiss(@AuthenticationPrincipal OidcUser user, @PathVariable String id) {
        suggestions.dismiss(user.getSubject(), id);
    }
    @DeleteMapping
    @ResponseStatus(NO_CONTENT)
    public void disconnect(@AuthenticationPrincipal OidcUser user, HttpSession session) {
        synchronized (session) {
            connection.disconnect(session);
            suggestions.delete(user.getSubject());
        }
    }
}
