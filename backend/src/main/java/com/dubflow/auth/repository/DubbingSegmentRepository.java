package com.dubflow.auth.repository;

import com.dubflow.auth.model.DubbingSegment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DubbingSegmentRepository extends JpaRepository<DubbingSegment, Long> {

    List<DubbingSegment> findByJobIdOrderByStartSecondsAsc(String jobId);

    long deleteByJobId(String jobId);
}
