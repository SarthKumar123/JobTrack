package com.jobtrack.workspace;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface FollowUpRepository extends JpaRepository<FollowUp, String> {
    List<FollowUp> findByOwnerIdOrderByDateDesc(String ownerId);
    Optional<FollowUp> findByIdAndOwnerId(String id, String ownerId);
}
