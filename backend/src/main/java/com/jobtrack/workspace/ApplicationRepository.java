package com.jobtrack.workspace;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface ApplicationRepository extends JpaRepository<Application, String> {
    List<Application> findByOwnerIdOrderByDateDesc(String ownerId);
    Optional<Application> findByIdAndOwnerId(String id, String ownerId);
}
