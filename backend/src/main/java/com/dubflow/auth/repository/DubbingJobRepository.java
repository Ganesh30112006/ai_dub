package com.dubflow.auth.repository;

import com.dubflow.auth.model.DubbingJob;
import com.dubflow.auth.model.DubbingJobStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface DubbingJobRepository extends JpaRepository<DubbingJob, String> {

    Optional<DubbingJob> findByIdAndOwnerEmail(String id, String ownerEmail);

    Optional<DubbingJob> findByProviderJobId(String providerJobId);

    List<DubbingJob> findByStatusAndUpdatedAtBefore(DubbingJobStatus status, Instant cutoff);
}
