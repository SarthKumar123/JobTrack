package com.jobtrack.gmail;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

interface EmailSuggestionRepository extends JpaRepository<EmailSuggestion, String> {
    boolean existsByOwnerIdAndMessageId(String ownerId, String messageId);
    List<EmailSuggestion> findByOwnerIdAndStatusOrderByDateDesc(String ownerId, String status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EmailSuggestion> findByIdAndOwnerId(String id, String ownerId);
    void deleteByOwnerId(String ownerId);
}
