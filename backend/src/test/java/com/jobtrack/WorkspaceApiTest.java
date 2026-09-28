package com.jobtrack;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:test;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.username=sa", "spring.datasource.password="
})
@AutoConfigureMockMvc
class WorkspaceApiTest {
    @Autowired MockMvc mvc;
    private final String owner = UUID.randomUUID().toString();
    private final String other = UUID.randomUUID().toString();

    private RequestPostProcessor account(String subject) {
        return oidcLogin().idToken(token -> token.subject(subject)
                .claim("name", "Test User").claim("email", "test@example.com"));
    }

    private String createApplication() throws Exception {
        String response = mvc.perform(post("/api/applications").with(account(owner)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"company":"Example","role":"Java Developer","location":"India",
                                 "mode":"Remote","stage":"Applied","date":"2026-09-28",
                                 "url":"https://example.com/jobs","notes":"Prepare APIs","resume":"Java"}
                                """))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.ownerId").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(response, "$.id");
    }

    @Test
    void authenticationAndCsrfAreRequired() throws Exception {
        mvc.perform(get("/api/workspace")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/applications").with(account(owner))
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/csrf")).andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
        mvc.perform(get("/oauth2/authorization/google")).andExpect(status().is3xxRedirection());
    }

    @Test
    void savedApplicationsArePrivateAndPersistAcrossRequests() throws Exception {
        String id = createApplication();
        mvc.perform(get("/api/workspace").with(account(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.apps[0].id").value(id));
        mvc.perform(get("/api/workspace").with(account(other)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.apps").isEmpty());
        mvc.perform(put("/api/applications/{id}/notes", id).with(account(other)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"notes\":\"Intrusion\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(patch("/api/applications/{id}/stage", id).with(account(other)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"stage\":\"Offer\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void stageHistoryIsSavedWithoutDuplicateEvents() throws Exception {
        String id = createApplication();
        for (int attempt = 0; attempt < 2; attempt++) {
            mvc.perform(patch("/api/applications/{id}/stage", id).with(account(owner)).with(csrf())
                            .contentType(MediaType.APPLICATION_JSON).content("{\"stage\":\"Interview\"}"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.history.length()").value(2));
        }
        mvc.perform(put("/api/applications/{id}/notes", id).with(account(owner)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"notes\":\"Saved notes\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/workspace").with(account(owner)))
                .andExpect(jsonPath("$.apps[0].stage").value("Interview"))
                .andExpect(jsonPath("$.apps[0].notes").value("Saved notes"));
    }

    @Test
    void childRecordsCannotReferenceAnotherUsersApplication() throws Exception {
        String id = createApplication();
        String interview = """
                {"appId":"%s","round":"Technical","date":"2026-09-29","time":"14:30",
                 "link":"","notes":"Java"}
                """.formatted(id);
        mvc.perform(post("/api/interviews").with(account(other)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(interview)).andExpect(status().isNotFound());
        mvc.perform(post("/api/interviews").with(account(owner)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(interview)).andExpect(status().isCreated());
        String task = "{\"appId\":\"" + id + "\",\"title\":\"Follow up\",\"date\":\"2026-09-30\"}";
        mvc.perform(post("/api/tasks").with(account(other)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(task)).andExpect(status().isNotFound());
        String response = mvc.perform(post("/api/tasks").with(account(owner)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(task))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String taskId = JsonPath.read(response, "$.id");
        mvc.perform(patch("/api/tasks/{id}", taskId).with(account(other)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"done\":true}"))
                .andExpect(status().isNotFound());
        mvc.perform(patch("/api/tasks/{id}", taskId).with(account(owner)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"done\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.done").value(true));
        mvc.perform(get("/api/workspace").with(account(other)))
                .andExpect(jsonPath("$.interviews").isEmpty()).andExpect(jsonPath("$.tasks").isEmpty());
    }

    @Test
    void invalidFieldsAndUnsafeLinksAreRejected() throws Exception {
        mvc.perform(post("/api/applications").with(account(owner)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        String id = createApplication();
        mvc.perform(patch("/api/applications/{id}/stage", id).with(account(owner)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"stage\":\"NotAStage\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/interviews").with(account(owner)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"appId":"%s","round":"Technical","date":"2026-09-29","time":"14:30",
                                 "link":"javascript:alert(1)","notes":""}
                                """.formatted(id)))
                .andExpect(status().isBadRequest());
    }
    @Test
    void realCsrfTokenFromSessionWorksForMutationsAndLogout() throws Exception {
        var tokenResult = mvc.perform(get("/api/csrf")).andExpect(status().isOk()).andReturn();
        var session = (MockHttpSession) tokenResult.getRequest().getSession(false);
        String json = tokenResult.getResponse().getContentAsString();
        String token = JsonPath.read(json, "$.token");
        String header = JsonPath.read(json, "$.headerName");
        mvc.perform(post("/api/applications").session(session).with(account(owner))
                        .header(header, token).contentType(MediaType.APPLICATION_JSON).content("""
                                {"company":"CSRF example","role":"Developer","location":"India",
                                 "mode":"Remote","stage":"Applied","date":"2026-09-28",
                                 "url":"","notes":"","resume":""}
                                """))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/logout").session(session).with(account(owner)).header(header, token))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
    }

}
