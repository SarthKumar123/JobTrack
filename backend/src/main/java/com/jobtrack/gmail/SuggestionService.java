package com.jobtrack.gmail;

import com.jobtrack.workspace.ApiModels.*;
import com.jobtrack.workspace.WorkspaceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
@Transactional
public class SuggestionService {
    private final EmailSuggestionRepository repository;
    private final WorkspaceService workspace;
    public SuggestionService(EmailSuggestionRepository repository, WorkspaceService workspace) {
        this.repository = repository;
        this.workspace = workspace;
    }
    public record View(String id, String subject, String sender, String snippet, String stage,
            String reason, LocalDate date, String company, String role, String mode) {}
    public record Approval(@Size(max = 100) String appId,
            @NotNull @Pattern(regexp = "Saved|Applied|Screening|Interview|Offer|Rejected|Withdrawn") String stage,
            @Valid ApplicationInput application) {}
    public record IngestResult(int review, List<ApplicationView> autoApplied) {}

    @Transactional(readOnly = true)
    public List<View> pending(String owner) {
        return repository.findByOwnerIdAndStatusOrderByDateDesc(owner, "Pending").stream()
                .map(s -> {
                    var details = EmailDetails.extract(s.subject, s.snippet);
                    return new View(s.id, s.subject, s.sender, s.snippet, s.stage, s.reason, s.date,
                            details.company(), details.role(), details.mode());
                }).toList();
    }

    public IngestResult ingest(String owner, List<GmailClient.Message> messages) {
        int review = 0;
        var autoApplied = new java.util.ArrayList<ApplicationView>();
        for (var message : messages) {
            if (message == null || message.id() == null || message.id().length() > 100
                    || repository.existsByOwnerIdAndMessageId(owner, message.id())) continue;
            String subject = clip(message.header("Subject"), 500), snippet = clip(message.snippet(), 1000);
            var match = EmailRules.classify(subject, snippet);
            if (match == null) continue;
            LocalDate date;
            try {
                date = Instant.ofEpochMilli(Long.parseLong(message.internalDate()))
                        .atZone(ZoneId.of("Asia/Kolkata")).toLocalDate();
            } catch (RuntimeException e) { continue; }
            var details = EmailDetails.extract(subject, snippet);
            if (("Applied".equals(match.stage()) || "Screening".equals(match.stage()))
                    && !details.company().isBlank()) {
                var updated = workspace.autoUpdateFromEmail(owner, details.company(), details.role(),
                        match.stage(), date);
                if (updated != null) {
                    var handled = new EmailSuggestion();
                    handled.ownerId = owner;
                    handled.messageId = message.id();
                    handled.subject = "";
                    handled.sender = "";
                    handled.snippet = "";
                    handled.stage = match.stage();
                    handled.reason = match.reason();
                    handled.date = date;
                    handled.status = "Approved";
                    repository.save(handled);
                    autoApplied.add(updated);
                    continue;
                }
            }

            var suggestion = new EmailSuggestion();
            suggestion.ownerId = owner;
            suggestion.messageId = message.id();
            suggestion.subject = subject;
            suggestion.sender = clip(message.header("From"), 500);
            suggestion.snippet = snippet;
            suggestion.stage = match.stage();
            suggestion.reason = match.reason();
            suggestion.date = date;
            repository.save(suggestion);
            review++;
        }
        return new IngestResult(review, autoApplied);
    }

    public ApplicationView approve(String owner, String id, Approval input) {
        var suggestion = ownedPending(owner, id);
        ApplicationView result;
        if (input.appId() != null && !input.appId().isBlank()) {
            if (input.application() != null) throw new ResponseStatusException(BAD_REQUEST, "Choose one application action.");
            result = workspace.changeStage(owner, input.appId(), new StageInput(input.stage()));
        } else {
            var a = input.application();
            if (a == null) throw new ResponseStatusException(BAD_REQUEST, "Enter the company and role for a new application.");
            result = workspace.createOrUpdateFromEmail(owner, new ApplicationInput(a.company(), a.role(), a.location(),
                    a.mode(), input.stage(), a.date(), a.url(), a.notes(), a.resume()));
        }
        clear(suggestion, "Approved");
        return result;
    }

    public void dismiss(String owner, String id) { clear(ownedPending(owner, id), "Dismissed"); }
    public void delete(String owner) { repository.deleteByOwnerId(owner); }
    private EmailSuggestion ownedPending(String owner, String id) {
        var suggestion = repository.findByIdAndOwnerId(id, owner)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND));
        if (!"Pending".equals(suggestion.status))
            throw new ResponseStatusException(CONFLICT, "This suggestion was already reviewed.");
        return suggestion;
    }
    private void clear(EmailSuggestion suggestion, String status) {
        suggestion.status = status;
        suggestion.subject = "";
        suggestion.sender = "";
        suggestion.snippet = "";
    }
    private String clip(String value, int max) {
        return value == null ? "" : value.substring(0, Math.min(value.length(), max));
    }
}
