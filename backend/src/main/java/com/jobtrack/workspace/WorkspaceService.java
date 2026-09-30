package com.jobtrack.workspace;

import static com.jobtrack.workspace.ApiModels.*;

import java.net.URI;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class WorkspaceService {
    private final ApplicationRepository applications;
    private final InterviewRepository interviews;
    private final FollowUpRepository followUps;

    public WorkspaceService(ApplicationRepository applications, InterviewRepository interviews,
            FollowUpRepository followUps) {
        this.applications = applications;
        this.interviews = interviews;
        this.followUps = followUps;
    }

    @Transactional(readOnly = true)
    public WorkspaceView workspace(String owner) {
        return new WorkspaceView(
                applications.findByOwnerIdOrderByDateDesc(owner).stream().map(this::view).toList(),
                interviews.findByOwnerIdOrderByDateDesc(owner).stream().map(this::view).toList(),
                followUps.findByOwnerIdOrderByDateDesc(owner).stream().map(this::view).toList());
    }

    public ApplicationView createApplication(String owner, ApplicationInput input) {
        Application application = new Application();
        application.ownerId = owner;
        application.company = input.company().trim();
        application.role = input.role().trim();
        application.location = input.location().trim();
        application.mode = input.mode();
        application.stage = input.stage();
        application.date = input.date();
        application.url = webLink(input.url());
        application.notes = input.notes();
        application.resume = input.resume().trim();
        application.history.add(new StageEvent(input.stage(), input.date()));
        return view(applications.save(application));
    }

    public ApplicationView changeStage(String owner, String id, StageInput input) {
        Application application = ownedApplication(owner, id);
        if (!application.stage.equals(input.stage())) {
            application.stage = input.stage();
            application.history.add(new StageEvent(input.stage(), LocalDate.now(ZoneId.of("Asia/Kolkata"))));
        }
        return view(application);
    }

    public ApplicationView createOrUpdateFromEmail(String owner, ApplicationInput input) {
        Application application = applications.findByOwnerIdOrderByDateDesc(owner).stream()
                .filter(existing -> sameApplication(existing, input))
                .max(Comparator.comparing(this::latestStageDate))
                .orElse(null);

        if (application == null) return createApplication(owner, input);

        LocalDate latest = latestStageDate(application);
        if (input.date().isBefore(latest) || !canAdvanceAutomatically(application.stage, input.stage()))
            return view(application);

        if (!application.stage.equals(input.stage())) {
            application.stage = input.stage();
            application.history.add(new StageEvent(input.stage(), input.date()));
        }
        return view(application);
    }

    public ApplicationView saveNotes(String owner, String id, NotesInput input) {
        Application application = ownedApplication(owner, id);
        application.notes = input.notes();
        return view(application);
    }

    public InterviewView createInterview(String owner, InterviewInput input) {
        Application application = ownedApplication(owner, input.appId());
        Interview interview = new Interview();
        interview.ownerId = owner;
        interview.appId = application.id;
        interview.round = input.round().trim();
        interview.date = input.date();
        interview.time = input.time();
        interview.link = webLink(input.link());
        interview.notes = input.notes();
        return view(interviews.save(interview));
    }

    public FollowUpView createFollowUp(String owner, FollowUpInput input) {
        Application application = ownedApplication(owner, input.appId());
        FollowUp task = new FollowUp();
        task.ownerId = owner;
        task.appId = application.id;
        task.title = input.title().trim();
        task.date = input.date();
        return view(followUps.save(task));
    }

    public FollowUpView completeFollowUp(String owner, String id, DoneInput input) {
        FollowUp task = followUps.findByIdAndOwnerId(id, owner)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        task.done = input.done();
        return view(task);
    }

    private Application ownedApplication(String owner, String id) {
        return applications.findByIdAndOwnerId(id, owner)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private boolean sameApplication(Application application, ApplicationInput input) {
        return normalize(application.company).equals(normalize(input.company()))
                && normalize(application.role).equals(normalize(input.role()));
    }

    private String normalize(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N}]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private LocalDate latestStageDate(Application application) {
        return application.history.stream().map(event -> event.date).max(LocalDate::compareTo)
                .orElse(application.date);
    }

    private boolean canAdvanceAutomatically(String current, String next) {
        if (current.equals(next)) return true;
        if ("Offer".equals(current) || "Rejected".equals(current) || "Withdrawn".equals(current))
            return false;
        if ("Offer".equals(next) || "Rejected".equals(next)) return true;
        return stageRank(next) > stageRank(current);
    }

    private int stageRank(String stage) {
        return switch (stage) {
            case "Saved" -> 0;
            case "Applied" -> 1;
            case "Screening" -> 2;
            case "Interview" -> 3;
            default -> -1;
        };
    }

    private String webLink(String value) {
        String link = value.trim();
        if (link.isEmpty()) return link;
        try {
            URI uri = URI.create(link);
            if (("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null && uri.getUserInfo() == null) return link;
        } catch (IllegalArgumentException ignored) {
            // Report malformed and unsupported links with the same client-facing message.
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a valid HTTP or HTTPS link");
    }

    private ApplicationView view(Application application) {
        return new ApplicationView(application.id, application.company, application.role,
                application.location, application.mode, application.stage, application.date,
                application.url, application.notes, application.resume,
                application.history.stream().map(event -> new HistoryView(event.stage, event.date)).toList());
    }

    private InterviewView view(Interview interview) {
        return new InterviewView(interview.id, interview.appId, interview.round, interview.date,
                interview.time.toString(), interview.link, interview.notes);
    }

    private FollowUpView view(FollowUp task) {
        return new FollowUpView(task.id, task.appId, task.title, task.date, task.done);
    }
}
