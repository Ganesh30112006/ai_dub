package com.dubflow.auth.controller;

import com.dubflow.auth.dto.CreateDubbingJobRequest;
import com.dubflow.auth.dto.DubbingJobResponse;
import com.dubflow.auth.dto.TimelineResponse;
import com.dubflow.auth.dto.UploadResponse;
import com.dubflow.auth.exception.AuthException;
import com.dubflow.auth.service.AuthService;
import com.dubflow.auth.service.DubbingService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/dubbing")
public class DubbingController {

    private final DubbingService dubbingService;

    public DubbingController(DubbingService dubbingService) {
        this.dubbingService = dubbingService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadResponse upload(@RequestParam("file") MultipartFile file, HttpSession session) {
        String email = sessionUserEmail(session);
        return dubbingService.upload(email, file);
    }

    @PostMapping("/jobs")
    public DubbingJobResponse createJob(@Valid @RequestBody CreateDubbingJobRequest input, HttpSession session) {
        String email = sessionUserEmail(session);
        return dubbingService.createJob(email, input);
    }

    @GetMapping("/jobs/{jobId}")
    public DubbingJobResponse getJob(@PathVariable String jobId, HttpSession session) {
        String email = sessionUserEmail(session);
        return dubbingService.getJob(email, jobId);
    }

    @GetMapping("/jobs/{jobId}/timeline")
    public TimelineResponse getTimeline(@PathVariable String jobId, HttpSession session) {
        String email = sessionUserEmail(session);
        return dubbingService.getTimeline(email, jobId);
    }

    @GetMapping("/jobs/{jobId}/export")
    public ResponseEntity<Resource> downloadExport(@PathVariable String jobId, HttpSession session) {
        String email = sessionUserEmail(session);
        Resource resource = dubbingService.getExport(email, jobId);
        MediaType contentType = MediaTypeFactory.getMediaType(resource.getFilename())
            .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(resource.getFilename()).build().toString())
            .contentType(contentType)
                .body(resource);
    }

    private String sessionUserEmail(HttpSession session) {
        Object email = session.getAttribute(AuthService.SESSION_USER_EMAIL_KEY);
        if (email instanceof String value) {
            return value;
        }
        throw new AuthException(HttpStatus.UNAUTHORIZED, "You are not signed in");
    }
}
