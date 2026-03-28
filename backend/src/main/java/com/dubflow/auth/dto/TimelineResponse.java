package com.dubflow.auth.dto;

import java.util.List;

public record TimelineResponse(
        String jobId,
        boolean ready,
        List<TimelineSegmentResponse> segments
) {
}
