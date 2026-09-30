package com.jobtrack.workspace;

import static com.jobtrack.workspace.ApiModels.*;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class WorkspaceController {
    private final WorkspaceService service;

    public WorkspaceController(WorkspaceService service) {
        this.service = service;
    }

    @GetMapping("/workspace")
    public WorkspaceView workspace(@AuthenticationPrincipal OidcUser user) {
        return service.workspace(user.getSubject());
    }

    @PostMapping("/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationView createApplication(@AuthenticationPrincipal OidcUser user,
            @Valid @RequestBody ApplicationInput input) {
        return service.createApplication(user.getSubject(), input);
    }

    @PatchMapping("/applications/{id}/stage")
    public ApplicationView changeStage(@AuthenticationPrincipal OidcUser user, @PathVariable String id,
            @Valid @RequestBody StageInput input) {
        return service.changeStage(user.getSubject(), id, input);
    }

    @PutMapping("/applications/{id}/notes")
    public ApplicationView saveNotes(@AuthenticationPrincipal OidcUser user, @PathVariable String id,
            @Valid @RequestBody NotesInput input) {
        return service.saveNotes(user.getSubject(), id, input);
    }

    @DeleteMapping("/applications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteApplication(@AuthenticationPrincipal OidcUser user, @PathVariable String id) {
        service.deleteApplication(user.getSubject(), id);
    }

    @PostMapping("/interviews")
    @ResponseStatus(HttpStatus.CREATED)
    public InterviewView createInterview(@AuthenticationPrincipal OidcUser user,
            @Valid @RequestBody InterviewInput input) {
        return service.createInterview(user.getSubject(), input);
    }

    @PostMapping("/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public FollowUpView createFollowUp(@AuthenticationPrincipal OidcUser user,
            @Valid @RequestBody FollowUpInput input) {
        return service.createFollowUp(user.getSubject(), input);
    }

    @PatchMapping("/tasks/{id}")
    public FollowUpView completeFollowUp(@AuthenticationPrincipal OidcUser user, @PathVariable String id,
            @Valid @RequestBody DoneInput input) {
        return service.completeFollowUp(user.getSubject(), id, input);
    }
}
