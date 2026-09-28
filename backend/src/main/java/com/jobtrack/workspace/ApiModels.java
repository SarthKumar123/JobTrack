package com.jobtrack.workspace;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public final class ApiModels {
    private ApiModels() {}

    public static final String STAGES = "Saved|Applied|Screening|Interview|Offer|Rejected|Withdrawn";

    public record ApplicationInput(
            @NotBlank @Size(max = 100) String company,
            @NotBlank @Size(max = 150) String role,
            @NotNull @Size(max = 100) String location,
            @NotNull @Pattern(regexp = "Remote|Hybrid|On-site") String mode,
            @NotNull @Pattern(regexp = STAGES) String stage,
            @NotNull LocalDate date,
            @NotNull @Size(max = 2048) String url,
            @NotNull @Size(max = 5000) String notes,
            @NotNull @Size(max = 150) String resume) {}

    public record StageInput(@NotNull @Pattern(regexp = STAGES) String stage) {}
    public record NotesInput(@NotNull @Size(max = 5000) String notes) {}
    public record DoneInput(@NotNull Boolean done) {}

    public record InterviewInput(
            @NotBlank String appId,
            @NotBlank @Size(max = 150) String round,
            @NotNull LocalDate date,
            @NotNull LocalTime time,
            @NotNull @Size(max = 2048) String link,
            @NotNull @Size(max = 5000) String notes) {}

    public record FollowUpInput(
            @NotBlank String appId,
            @NotBlank @Size(max = 150) String title,
            @NotNull LocalDate date) {}

    public record HistoryView(String stage, LocalDate date) {}
    public record ApplicationView(String id, String company, String role, String location,
            String mode, String stage, LocalDate date, String url, String notes, String resume,
            List<HistoryView> history) {}
    public record InterviewView(String id, String appId, String round, LocalDate date,
            String time, String link, String notes) {}
    public record FollowUpView(String id, String appId, String title, LocalDate date, boolean done) {}
    public record WorkspaceView(List<ApplicationView> apps, List<InterviewView> interviews,
            List<FollowUpView> tasks) {}
}
