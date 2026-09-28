package com.jobtrack.workspace;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "follow_ups")
class FollowUp {
    @Id
    @Column(length = 36)
    String id = UUID.randomUUID().toString();

    @Column(name = "owner_id", nullable = false, length = 255)
    String ownerId;

    @Column(name = "app_id", nullable = false, length = 36)
    String appId;

    @Column(name = "title", nullable = false, length = 150)
    String title;

    @Column(name = "event_date", nullable = false)
    LocalDate date;

    @Column(name = "done", nullable = false)
    boolean done;
}
