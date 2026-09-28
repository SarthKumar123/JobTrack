package com.jobtrack.workspace;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "applications")
class Application {
    @Id
    @Column(length = 36)
    String id = UUID.randomUUID().toString();

    @Column(name = "owner_id", nullable = false, length = 255)
    String ownerId;

    @Column(name = "company", nullable = false, length = 100)
    String company;

    @Column(name = "role_name", nullable = false, length = 150)
    String role;

    @Column(name = "location", nullable = false, length = 100)
    String location;

    @Column(name = "work_mode", nullable = false, length = 20)
    String mode;

    @Column(name = "stage", nullable = false, length = 20)
    String stage;

    @Column(name = "event_date", nullable = false)
    LocalDate date;

    @Column(name = "url", nullable = false, length = 2048)
    String url;

    @Column(name = "notes", nullable = false, length = 5000)
    String notes;

    @Column(name = "resume", nullable = false, length = 150)
    String resume;

    @ElementCollection
    @CollectionTable(name = "application_history", joinColumns = @JoinColumn(name = "app_id"))
    @OrderColumn(name = "position")
    List<StageEvent> history = new ArrayList<>();
}
