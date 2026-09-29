package com.jobtrack.gmail;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "email_suggestions", uniqueConstraints = @UniqueConstraint(columnNames = {"owner_id", "message_id"}))
class EmailSuggestion {
    @Id @Column(length = 36) String id = UUID.randomUUID().toString();
    @Column(nullable = false, length = 255) String ownerId;
    @Column(nullable = false, length = 100) String messageId;
    @Column(nullable = false, length = 500) String subject;
    @Column(nullable = false, length = 500) String sender;
    @Column(nullable = false, length = 1000) String snippet;
    @Column(nullable = false, length = 20) String stage;
    @Column(nullable = false, length = 200) String reason;
    @Column(nullable = false) LocalDate date;
    @Column(nullable = false, length = 20) String status = "Pending";
    protected EmailSuggestion() {}
}
