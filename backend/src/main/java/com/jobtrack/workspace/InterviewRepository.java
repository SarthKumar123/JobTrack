package com.jobtrack.workspace;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

interface InterviewRepository extends JpaRepository<Interview, String> {
    List<Interview> findByOwnerIdOrderByDateDesc(String ownerId);
}
