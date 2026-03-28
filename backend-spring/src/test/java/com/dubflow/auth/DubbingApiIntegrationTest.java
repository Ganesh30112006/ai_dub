package com.dubflow.auth;

import com.dubflow.auth.model.DubbingJob;
import com.dubflow.auth.model.DubbingJobStatus;
import com.dubflow.auth.model.UploadedAsset;
import com.dubflow.auth.repository.DubbingJobRepository;
import com.dubflow.auth.repository.DubbingSegmentRepository;
import com.dubflow.auth.repository.UploadedAssetRepository;
import com.dubflow.auth.service.AuthService;
import com.dubflow.auth.service.SoftcatalaDubbingClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.greaterThan;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:dubflow_test;MODE=MySQL;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "dubflow.ai.provider=softcatala",
        "dubflow.storage.root=./target/test-storage"
})
@AutoConfigureMockMvc
class DubbingApiIntegrationTest {

    private static final String TEST_EMAIL = "integration@example.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UploadedAssetRepository uploadedAssetRepository;

    @Autowired
    private DubbingJobRepository dubbingJobRepository;

    @Autowired
    private DubbingSegmentRepository dubbingSegmentRepository;

    @MockBean
    private SoftcatalaDubbingClient softcatalaDubbingClient;

    @BeforeEach
    void clean() {
        dubbingSegmentRepository.deleteAll();
        dubbingJobRepository.deleteAll();
        uploadedAssetRepository.deleteAll();
    }

    @Test
    void completedJobReturnsExportAndNonEmptyTimelineWhenUtterancesMissing() throws Exception {
        Path exportFile = Path.of("target", "test-storage", "exports", "integration-export.mp4");
        Files.createDirectories(exportFile.getParent());
        Files.write(exportFile, "test-export".getBytes());

        String uploadId = UUID.randomUUID().toString();
        UploadedAsset asset = new UploadedAsset(
                uploadId,
                TEST_EMAIL,
                "clip.mp4",
                "video/mp4",
                1024,
                exportFile.toString(),
                Instant.now()
        );
        uploadedAssetRepository.save(asset);

        Instant now = Instant.now();
        DubbingJob job = new DubbingJob(
                UUID.randomUUID().toString(),
                TEST_EMAIL,
                uploadId,
                "clip.mp4",
                "eng",
                "cat",
                "central",
                DubbingJobStatus.COMPLETED,
                100,
                "Alignment",
                now,
                now
        );
        job.setExportPath(exportFile.toString());
        job.setProviderJobId("provider-job-1");
        dubbingJobRepository.save(job);

        when(softcatalaDubbingClient.getUtterances(anyString())).thenReturn(List.of());

        mockMvc.perform(get("/api/dubbing/jobs/{jobId}/export", job.getId())
                        .sessionAttr(AuthService.SESSION_USER_EMAIL_KEY, TEST_EMAIL))
                .andExpect(status().isOk())
                .andExpect(content().contentType("video/mp4"));

        mockMvc.perform(get("/api/dubbing/jobs/{jobId}/timeline", job.getId())
                        .sessionAttr(AuthService.SESSION_USER_EMAIL_KEY, TEST_EMAIL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ready").value(true))
                .andExpect(jsonPath("$.segments.length()").value(greaterThan(0)));
    }
}
