package com.jobtrack.workspace;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "interviews")
class Interview {
    @Id
    @Column(length = 36)
    String id = UUID.randomUUID().toString();

    @Column(name = "owner_id", nullable = false, length = 255)
    String ownerId;

    @Column(name = "app_id", nullable = false, length = 36)
    String appId;

    @Column(name = "round_name", nullable = false, length = 150)
    String round;

    @Column(name = "event_date", nullable = false)
    LocalDate date;

    @Column(name = "event_time", nullable = false)
    LocalTime time;

    @Column(name = "link", nullable = false, length = 2048)
    String link;

    @Column(name = "notes", nullable = false, length = 5000)
    String notes;
}
