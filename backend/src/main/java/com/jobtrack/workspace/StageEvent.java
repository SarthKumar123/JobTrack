package com.jobtrack.workspace;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.time.LocalDate;

@Embeddable
class StageEvent {
    @Column(nullable = false, length = 20)
    String stage;
    @Column(name = "event_date", nullable = false)
    LocalDate date;

    protected StageEvent() {}

    StageEvent(String stage, LocalDate date) {
        this.stage = stage;
        this.date = date;
    }
}
