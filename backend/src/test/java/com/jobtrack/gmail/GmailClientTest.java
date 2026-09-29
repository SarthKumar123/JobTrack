package com.jobtrack.gmail;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
import static org.springframework.http.HttpStatus.*;

class GmailClientTest {
    @Test void sendsBearerTokenAndReadsOnlyRequestedMetadata() {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var client = new GmailClient(builder.build());
        server.expect(request -> {
            String uri = java.net.URLDecoder.decode(request.getURI().toString(), java.nio.charset.StandardCharsets.UTF_8);
            assertTrue(uri.startsWith("https://gmail.googleapis.com/gmail/v1/users/me/messages?"));
            assertTrue(uri.contains("maxResults=50"));
            assertTrue(uri.contains("newer_than:30d"));
        }).andExpect(header("Authorization", "Bearer test-token"))
            .andRespond(withSuccess("{\"messages\":[{\"id\":\"abc\",\"threadId\":\"ignored\"}],\"resultSizeEstimate\":1}", MediaType.APPLICATION_JSON));
        assertEquals("abc", client.search("test-token").messages().get(0).id());
        server.verify();
        server.reset();
        server.expect(request -> {
            String uri = java.net.URLDecoder.decode(request.getURI().toString(), java.nio.charset.StandardCharsets.UTF_8);
            assertTrue(uri.contains("/messages/abc?format=metadata"));
            assertTrue(uri.contains("metadataHeaders=Subject"));
            assertFalse(uri.contains("format=full"));
        }).andExpect(header("Authorization", "Bearer test-token"))
            .andRespond(withSuccess("""
                {"id":"abc","snippet":"Application received","internalDate":"1790636400000",
                 "payload":{"headers":[{"name":"Subject","value":"Your application"}]}}
                """, MediaType.APPLICATION_JSON));
        assertEquals("Your application", client.message("test-token", "abc").header("subject"));
        server.verify();
    }
    @Test void providerErrorsBecomeSafeActionableErrors() {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var client = new GmailClient(builder.build());
        server.expect(anything()).andRespond(withStatus(FORBIDDEN).body("sensitive upstream content"));
        var error = assertThrows(ResponseStatusException.class, () -> client.search("secret"));
        assertEquals(BAD_GATEWAY, error.getStatusCode());
        assertFalse(error.getMessage().contains("sensitive"));
        assertFalse(error.getMessage().contains("secret"));
        server.verify();
    }
}
