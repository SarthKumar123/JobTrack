package com.jobtrack.gmail;

import com.jayway.jsonpath.JsonPath;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:gmail;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
    "spring.datasource.username=sa", "spring.datasource.password="
})
@AutoConfigureMockMvc
class GmailApiTest {
    @Autowired MockMvc mvc;
    @Autowired SuggestionService suggestions;
    @Autowired EmailSuggestionRepository repository;
    @MockitoBean GmailClient client;
    private final String owner = UUID.randomUUID().toString();
    private RequestPostProcessor account(String subject) {
        return oidcLogin().idToken(t -> t.subject(subject).claim("email", "test@example.com"));
    }
    private GmailClient.Message message(String id, String subject) {
        return new GmailClient.Message(id, "Thank you for applying", "1790636400000",
            new GmailClient.Payload(List.of(new GmailClient.Header("Subject", subject),
                new GmailClient.Header("From", "Hiring <jobs@example.com>"))));
    }
    private String begin(MockHttpSession session) throws Exception {
        String body = mvc.perform(post("/api/gmail/connect").session(session).with(account(owner)).with(csrf()))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String url = JsonPath.read(body, "$.url");
        assertTrue(url.contains("code_challenge_method=S256"));
        assertTrue(url.contains("access_type=online"));
        assertTrue(URLDecoder.decode(url, StandardCharsets.UTF_8).contains(GmailClient.SCOPE));
        return url.split("state=")[1].split("&")[0];
    }
    private void connect(MockHttpSession session) throws Exception {
        String state = begin(session);
        when(client.exchange(anyString(), anyString(), anyString(), anyString(), anyString()))
            .thenReturn(new GmailClient.Tokens("test-token", "openid email " + GmailClient.SCOPE, 3600));
        when(client.identity("test-token")).thenReturn(new GmailClient.Identity(owner));
        mvc.perform(get("/api/gmail/callback").session(session).with(account(owner))
            .param("state", state).param("code", "test-code"))
            .andExpect(redirectedUrl("http://localhost:5173/?gmail=connected"));
    }
    @Test void connectionRequiresAuthenticationCsrfStateAndMatchingAccount() throws Exception {
        mvc.perform(get("/api/gmail")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/gmail/connect").with(account(owner))).andExpect(status().isForbidden());
        var session = new MockHttpSession();
        String state = begin(session);
        mvc.perform(get("/api/gmail/callback").session(session).with(account(owner))
            .param("state", "wrong").param("code", "code"))
            .andExpect(redirectedUrl("http://localhost:5173/?gmail=expired"));
        verifyNoInteractions(client);
        state = begin(session);
        when(client.exchange(anyString(), anyString(), anyString(), anyString(), anyString()))
            .thenReturn(new GmailClient.Tokens("test-token", GmailClient.SCOPE, 3600));
        when(client.identity("test-token")).thenReturn(new GmailClient.Identity("someone-else"));
        mvc.perform(get("/api/gmail/callback").session(session).with(account(owner))
            .param("state", state).param("code", "code"))
            .andExpect(redirectedUrl("http://localhost:5173/?gmail=wrong-account"));
        mvc.perform(get("/api/gmail").session(session).with(account(owner)))
            .andExpect(jsonPath("$.connected").value(false));
        mvc.perform(get("/api/gmail/callback").session(session).with(account(owner))
            .param("state", state).param("code", "code"))
            .andExpect(redirectedUrl("http://localhost:5173/?gmail=expired"));
    }
    @Test void deniedScopesDoNotConnectAndExpiredAccessCannotSync() throws Exception {
        var session = new MockHttpSession();
        String state = begin(session);
        when(client.exchange(anyString(), anyString(), anyString(), anyString(), anyString()))
            .thenReturn(new GmailClient.Tokens("test-token", "openid email", 3600));
        mvc.perform(get("/api/gmail/callback").session(session).with(account(owner))
            .param("state", state).param("code", "code"))
            .andExpect(redirectedUrl("http://localhost:5173/?gmail=denied"));
        verify(client, never()).identity(anyString());
        state = begin(session);
        when(client.exchange(anyString(), anyString(), anyString(), anyString(), anyString()))
            .thenReturn(new GmailClient.Tokens("test-token", GmailClient.SCOPE, 0));
        when(client.identity("test-token")).thenReturn(new GmailClient.Identity(owner));
        mvc.perform(get("/api/gmail/callback").session(session).with(account(owner))
            .param("state", state).param("code", "code")).andExpect(status().isSeeOther());
        mvc.perform(post("/api/gmail/sync").session(session).with(account(owner)).with(csrf()))
            .andExpect(status().isConflict());
        verify(client, never()).search(anyString());
    }
    @Test void syncQueuesPrivateSuggestionsWithoutChangingWorkspaceAndDisconnectClearsThem() throws Exception {
        var session = new MockHttpSession();
        connect(session);
        var email = message("mail-1", "Application received");
        when(client.search("test-token")).thenReturn(new GmailClient.Page(List.of(email), "next-page"));
        when(client.message("test-token", "mail-1")).thenReturn(email);
        mvc.perform(post("/api/gmail/sync").session(session).with(account(owner)).with(csrf()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.needsReview").value(1))
            .andExpect(jsonPath("$.limited").value(true));
        mvc.perform(get("/api/workspace").with(account(owner))).andExpect(jsonPath("$.apps").isEmpty());
        mvc.perform(get("/api/gmail").session(session).with(account(owner)))
            .andExpect(jsonPath("$.suggestions.length()").value(1))
            .andExpect(jsonPath("$.token").doesNotExist());
        mvc.perform(get("/api/gmail").with(account("other"))).andExpect(jsonPath("$.suggestions").isEmpty());
        mvc.perform(post("/api/gmail/sync").session(session).with(account(owner)).with(csrf()))
            .andExpect(status().isTooManyRequests());
        assertEquals(0, suggestions.ingest(owner, List.of(email)).review());
        mvc.perform(delete("/api/gmail").session(session).with(account(owner)).with(csrf()))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/gmail").session(session).with(account(owner)))
            .andExpect(jsonPath("$.connected").value(false)).andExpect(jsonPath("$.suggestions").isEmpty());
    }
    @Test void syncAutoAppliesClearAppliedEmailAndLeavesUnclearMailForReview() throws Exception {
        var session = new MockHttpSession();
        connect(session);

        String created = mvc.perform(post("/api/applications").with(account(owner)).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("""
                {"company":"Acme","role":"Java Developer","location":"","mode":"Remote","stage":"Saved",
                "date":"2026-09-29","url":"","notes":"","resume":""}
                """)).andReturn().getResponse().getContentAsString();
        String appId = JsonPath.read(created, "$.id");

        var clear = message("auto-applied", "Application for Java Developer at Acme");
        var unclear = message("needs-review", "Application received");
        when(client.search("test-token")).thenReturn(new GmailClient.Page(List.of(clear, unclear), null));
        when(client.message("test-token", "auto-applied")).thenReturn(clear);
        when(client.message("test-token", "needs-review")).thenReturn(unclear);

        mvc.perform(post("/api/gmail/sync").session(session).with(account(owner)).with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.autoApplied").value(1))
            .andExpect(jsonPath("$.needsReview").value(1))
            .andExpect(jsonPath("$.updatedApplications[0].id").value(appId))
            .andExpect(jsonPath("$.updatedApplications[0].stage").value("Applied"));

        mvc.perform(get("/api/gmail").session(session).with(account(owner)))
            .andExpect(jsonPath("$.suggestions.length()").value(1));
    }

    @Test void approvalValidatesOwnershipInputAndCannotBeReplayed() throws Exception {
        suggestions.ingest(owner, List.of(message("mail-2", "Application received")));
        String id = suggestions.pending(owner).get(0).id();
        String body = """
            {"stage":"Applied","application":{"company":"Acme","role":"Java Developer",
            "location":"","mode":"Remote","stage":"Applied","date":"2026-09-29",
            "url":"","notes":"","resume":""}}
            """;
        mvc.perform(post("/api/gmail/suggestions/{id}/approve", id).with(account("other")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isNotFound());
        mvc.perform(post("/api/gmail/suggestions/{id}/approve", id).with(account(owner)).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(body.replace("Acme", ""))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/gmail/suggestions/{id}/approve", id).with(account(owner)).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
        mvc.perform(post("/api/gmail/suggestions/{id}/approve", id).with(account(owner)).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isConflict());
        mvc.perform(get("/api/workspace").with(account(owner))).andExpect(jsonPath("$.apps.length()").value(1));
        var reviewed = repository.findById(id).orElseThrow();
        assertEquals("", reviewed.snippet);
        assertEquals("", reviewed.subject);
        assertEquals(0, suggestions.ingest(owner, List.of(message("mail-2", "Application received"))).review());
    }
    @Test void cannotApproveIntoAnotherUsersApplicationAndDismissDoesNotChangeTracker() throws Exception {
        String created = mvc.perform(post("/api/applications").with(account("other")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("""
                {"company":"Other","role":"Developer","location":"","mode":"Remote","stage":"Applied",
                "date":"2026-09-29","url":"","notes":"","resume":""}
                """)).andReturn().getResponse().getContentAsString();
        String app = JsonPath.read(created, "$.id");
        suggestions.ingest(owner, List.of(message("mail-3", "Interview invitation")));
        String id = suggestions.pending(owner).get(0).id();
        mvc.perform(post("/api/gmail/suggestions/{id}/approve", id).with(account(owner)).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"appId\":\"" + app + "\",\"stage\":\"Interview\"}"))
            .andExpect(status().isNotFound());
        assertEquals(1, suggestions.pending(owner).size());
        mvc.perform(post("/api/gmail/suggestions/{id}/dismiss", id).with(account("other")).with(csrf()))
            .andExpect(status().isNotFound());
        mvc.perform(post("/api/gmail/suggestions/{id}/dismiss", id).with(account(owner)).with(csrf()))
            .andExpect(status().isNoContent());
        assertEquals(0, suggestions.pending(owner).size());
        mvc.perform(get("/api/workspace").with(account(owner))).andExpect(jsonPath("$.apps").isEmpty());
    }
    @Test void approvalCanUpdateAnOwnedApplication() throws Exception {
        suggestions.ingest(owner, List.of(message("first", "Application received")));
        String first = suggestions.pending(owner).get(0).id();
        var app = suggestions.approve(owner, first, new SuggestionService.Approval(null, "Applied",
            new com.jobtrack.workspace.ApiModels.ApplicationInput("Acme", "Developer", "", "Remote",
                "Applied", java.time.LocalDate.now(), "", "", "")));
        suggestions.ingest(owner, List.of(message("second", "Interview invitation")));
        String second = suggestions.pending(owner).get(0).id();
        mvc.perform(post("/api/gmail/suggestions/{id}/approve", second).with(account(owner)).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"appId\":\"" + app.id() + "\",\"stage\":\"Interview\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.stage").value("Interview"))
            .andExpect(jsonPath("$.history.length()").value(2));
    }

    @Test void approvalUpdatesMatchingCompanyAndRoleInsteadOfCreatingDuplicate() throws Exception {
        suggestions.ingest(owner, List.of(message("apply-acme", "Application received")));
        String first = suggestions.pending(owner).get(0).id();
        String applied = """
            {"stage":"Applied","application":{"company":"Acme Technologies","role":"Java Developer",
            "location":"","mode":"Remote","stage":"Applied","date":"2026-09-28",
            "url":"","notes":"","resume":""}}
            """;
        mvc.perform(post("/api/gmail/suggestions/{id}/approve", first).with(account(owner)).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(applied))
            .andExpect(status().isOk()).andExpect(jsonPath("$.stage").value("Applied"));

        suggestions.ingest(owner, List.of(message("screen-acme", "Online assessment")));
        String second = suggestions.pending(owner).get(0).id();
        String screening = """
            {"stage":"Screening","application":{"company":"  ACME   Technologies ","role":"java developer",
            "location":"","mode":"Remote","stage":"Screening","date":"2026-09-29",
            "url":"","notes":"","resume":""}}
            """;
        mvc.perform(post("/api/gmail/suggestions/{id}/approve", second).with(account(owner)).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(screening))
            .andExpect(status().isOk()).andExpect(jsonPath("$.stage").value("Screening"))
            .andExpect(jsonPath("$.history.length()").value(2));

        mvc.perform(get("/api/workspace").with(account(owner)))
            .andExpect(jsonPath("$.apps.length()").value(1))
            .andExpect(jsonPath("$.apps[0].company").value("Acme Technologies"))
            .andExpect(jsonPath("$.apps[0].stage").value("Screening"));
    }

    @Test void newerEmailFallsBackToSingleActiveApplicationAtSameCompany() throws Exception {
        suggestions.ingest(owner, List.of(message("hcs-apply", "Application received")));
        String first = suggestions.pending(owner).get(0).id();
        var original = suggestions.approve(owner, first, new SuggestionService.Approval(null, "Applied",
            new com.jobtrack.workspace.ApiModels.ApplicationInput(
                "Hindustan Consulting Services India Private Limited", "SOFTWARE DEVELOPER- Fresher",
                "", "On-site", "Applied", java.time.LocalDate.of(2026, 9, 30), "", "", "")));

        suggestions.ingest(owner, List.of(message("hcs-screen", "Online assessment")));
        String second = suggestions.pending(owner).get(0).id();
        var updated = suggestions.approve(owner, second, new SuggestionService.Approval(null, "Screening",
            new com.jobtrack.workspace.ApiModels.ApplicationInput(
                "Hindustan Consulting Services India Private Limited", "Associate Software Engineer",
                "", "On-site", "Screening", java.time.LocalDate.of(2026, 10, 1), "", "", "")));

        assertEquals(original.id(), updated.id());
        assertEquals("SOFTWARE DEVELOPER- Fresher", updated.role());
        assertEquals("Screening", updated.stage());
        assertEquals(2, updated.history().size());
        mvc.perform(get("/api/workspace").with(account(owner)))
            .andExpect(jsonPath("$.apps.length()").value(1));
    }

    @Test void companyFallbackDoesNotMergeWhenMultipleActiveRolesExist() throws Exception {
        suggestions.ingest(owner, List.of(message("acme-one", "Application received")));
        String first = suggestions.pending(owner).get(0).id();
        suggestions.approve(owner, first, new SuggestionService.Approval(null, "Applied",
            new com.jobtrack.workspace.ApiModels.ApplicationInput("Acme", "Java Developer", "", "Remote",
                "Applied", java.time.LocalDate.of(2026, 9, 28), "", "", "")));

        suggestions.ingest(owner, List.of(message("acme-two", "Application received")));
        String second = suggestions.pending(owner).get(0).id();
        suggestions.approve(owner, second, new SuggestionService.Approval(null, "Applied",
            new com.jobtrack.workspace.ApiModels.ApplicationInput("Acme", "Backend Engineer", "", "Remote",
                "Applied", java.time.LocalDate.of(2026, 9, 29), "", "", "")));

        suggestions.ingest(owner, List.of(message("acme-screen", "Online assessment")));
        String third = suggestions.pending(owner).get(0).id();
        suggestions.approve(owner, third, new SuggestionService.Approval(null, "Screening",
            new com.jobtrack.workspace.ApiModels.ApplicationInput("Acme", "Software Engineer", "", "Remote",
                "Screening", java.time.LocalDate.of(2026, 10, 1), "", "", "")));

        mvc.perform(get("/api/workspace").with(account(owner)))
            .andExpect(jsonPath("$.apps.length()").value(3));
    }

    @Test void olderMatchingEmailCannotMoveApplicationBackward() throws Exception {
        suggestions.ingest(owner, List.of(message("interview-acme", "Interview invitation")));
        String first = suggestions.pending(owner).get(0).id();
        suggestions.approve(owner, first, new SuggestionService.Approval(null, "Interview",
            new com.jobtrack.workspace.ApiModels.ApplicationInput("Acme", "Developer", "", "Remote",
                "Interview", java.time.LocalDate.of(2026, 9, 30), "", "", "")));

        suggestions.ingest(owner, List.of(message("old-apply-acme", "Application received")));
        String second = suggestions.pending(owner).get(0).id();
        var result = suggestions.approve(owner, second, new SuggestionService.Approval(null, "Applied",
            new com.jobtrack.workspace.ApiModels.ApplicationInput("acme", "developer", "", "Remote",
                "Applied", java.time.LocalDate.of(2026, 9, 28), "", "", "")));

        assertEquals("Interview", result.stage());
        assertEquals(1, result.history().size());
        mvc.perform(get("/api/workspace").with(account(owner)))
            .andExpect(jsonPath("$.apps.length()").value(1))
            .andExpect(jsonPath("$.apps[0].stage").value("Interview"));
    }
    @Test void rulesSkipAlertsAndPrioritizeRejectionsOverQuotedConfirmations() {
        assertNull(EmailRules.classify("Job alert: Java", "Thank you for applying"));
        assertNull(EmailRules.classify("Dinner", "See you tomorrow"));
        assertEquals("Rejected", EmailRules.classify("Your application", "Thank you for applying. We will not be moving forward").stage());
        assertEquals("Offer", EmailRules.classify("Offer letter", "").stage());
        assertEquals("Screening", EmailRules.classify("Online assessment", "").stage());
    }
}
