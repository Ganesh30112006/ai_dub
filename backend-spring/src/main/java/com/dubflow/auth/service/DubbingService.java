package com.dubflow.auth.service;

import com.dubflow.auth.dto.CreateDubbingJobRequest;
import com.dubflow.auth.dto.DubbingJobResponse;
import com.dubflow.auth.dto.DubbingStepStatus;
import com.dubflow.auth.dto.TimelineResponse;
import com.dubflow.auth.dto.TimelineSegmentResponse;
import com.dubflow.auth.dto.UploadResponse;
import com.dubflow.auth.exception.AuthException;
import com.dubflow.auth.model.DubbingJob;
import com.dubflow.auth.model.DubbingJobStatus;
import com.dubflow.auth.model.DubbingSegment;
import com.dubflow.auth.model.UploadedAsset;
import com.dubflow.auth.repository.DubbingJobRepository;
import com.dubflow.auth.repository.DubbingSegmentRepository;
import com.dubflow.auth.repository.UploadedAssetRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class DubbingService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DubbingService.class);

    private static final List<String> PIPELINE_STEPS = List.of(
            "Audio Extraction",
            "Noise Reduction",
            "Diarization",
            "ASR / Transcription",
            "Translation",
            "TTS Synthesis",
            "Alignment"
    );

    private final UploadedAssetRepository uploadedAssetRepository;
    private final DubbingJobRepository dubbingJobRepository;
    private final DubbingSegmentRepository dubbingSegmentRepository;
    private final OpenAiDubbingClient openAiDubbingClient;
    private final SoftcatalaDubbingClient softcatalaDubbingClient;
    private final Path backendProjectDir;
    private final Path uploadsDir;
    private final Path exportsDir;

    @Value("${dubflow.ai.provider:softcatala}")
    private String provider;

    @Value("${dubflow.external.softcatala.variant:central}")
    private String softcatalaVariant;

    @Value("${dubflow.external.softcatala.poll-seconds:6}")
    private long softcatalaPollSeconds;

    @Value("${dubflow.external.softcatala.timeout-minutes:90}")
    private long softcatalaTimeoutMinutes;

    @Value("${dubflow.ai.stale-running-timeout-minutes:30}")
    private long staleRunningTimeoutMinutes;

    public DubbingService(
            UploadedAssetRepository uploadedAssetRepository,
            DubbingJobRepository dubbingJobRepository,
            DubbingSegmentRepository dubbingSegmentRepository,
            OpenAiDubbingClient openAiDubbingClient,
            SoftcatalaDubbingClient softcatalaDubbingClient,
            @Value("${dubflow.storage.root:./storage}") String storageRoot
    ) {
        this.uploadedAssetRepository = uploadedAssetRepository;
        this.dubbingJobRepository = dubbingJobRepository;
        this.dubbingSegmentRepository = dubbingSegmentRepository;
        this.openAiDubbingClient = openAiDubbingClient;
        this.softcatalaDubbingClient = softcatalaDubbingClient;

        Path cwd = Paths.get("").toAbsolutePath().normalize();
        if (Files.exists(cwd.resolve("pom.xml"))) {
            this.backendProjectDir = cwd;
        } else if (Files.exists(cwd.resolve("backend-spring").resolve("pom.xml"))) {
            this.backendProjectDir = cwd.resolve("backend-spring").normalize();
        } else {
            this.backendProjectDir = cwd;
        }

        Path configuredStorageRoot = Paths.get(storageRoot);
        if (!configuredStorageRoot.isAbsolute()) {
            configuredStorageRoot = backendProjectDir.resolve(configuredStorageRoot).normalize();
        }

        this.uploadsDir = configuredStorageRoot.resolve("uploads");
        this.exportsDir = configuredStorageRoot.resolve("exports");
    }

    @Transactional
    public UploadResponse upload(String ownerEmail, MultipartFile file) {
        if (file.isEmpty()) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Please upload a non-empty media file");
        }

        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        if (!contentType.startsWith("audio") && !contentType.startsWith("video")) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Only audio/video files are supported");
        }

        String uploadId = UUID.randomUUID().toString();
        String originalName = StringUtils.hasText(file.getOriginalFilename()) ? file.getOriginalFilename() : "uploaded-media";
        String safeName = originalName.replaceAll("[^A-Za-z0-9._-]", "_");
        String storedName = uploadId + "_" + safeName;

        try {
            Files.createDirectories(uploadsDir);
            Path destination = uploadsDir.resolve(storedName);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            UploadedAsset asset = new UploadedAsset(
                    uploadId,
                    ownerEmail,
                    originalName,
                    contentType,
                    file.getSize(),
                    destination.toAbsolutePath().normalize().toString(),
                    Instant.now()
            );
            uploadedAssetRepository.save(asset);
        } catch (IOException ex) {
            throw new AuthException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store uploaded file");
        }

        return new UploadResponse(uploadId, originalName, file.getSize(), contentType);
    }

    @Transactional
    public DubbingJobResponse createJob(String ownerEmail, CreateDubbingJobRequest input) {
        UploadedAsset asset = uploadedAssetRepository.findById(input.uploadId())
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "Upload not found"));

        if (!asset.getOwnerEmail().equals(ownerEmail)) {
            throw new AuthException(HttpStatus.FORBIDDEN, "Upload does not belong to current user");
        }

        String normalizedSourceLanguage = input.sourceLanguage().toLowerCase(Locale.ROOT);
        String normalizedTargetLanguage = input.targetLanguage().toLowerCase(Locale.ROOT);
        if ("softcatala".equalsIgnoreCase(provider)) {
            normalizedSourceLanguage = normalizeSourceLanguageForSoftcatala(normalizedSourceLanguage);
            normalizedTargetLanguage = "cat";
        }

        Instant now = Instant.now();
        DubbingJob job = new DubbingJob(
                UUID.randomUUID().toString(),
                ownerEmail,
                input.uploadId(),
                asset.getOriginalFileName(),
            normalizedSourceLanguage,
            normalizedTargetLanguage,
                input.voiceModel(),
                DubbingJobStatus.RUNNING,
                0,
                PIPELINE_STEPS.get(0),
                now,
                now
        );

        dubbingJobRepository.save(job);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                CompletableFuture.runAsync(() -> processJob(job.getId()));
            }
        });
        return toJobResponse(job);
    }

    @Transactional
    public DubbingJobResponse getJob(String ownerEmail, String jobId) {
        DubbingJob job = getOwnedJob(ownerEmail, jobId);
        maybeMarkStaleFailed(job);
        return toJobResponse(job);
    }

    @Transactional
    public TimelineResponse getTimeline(String ownerEmail, String jobId) {
        DubbingJob job = getOwnedJob(ownerEmail, jobId);
        maybeMarkStaleFailed(job);

        List<DubbingSegment> segments = dubbingSegmentRepository.findByJobIdOrderByStartSecondsAsc(jobId);
        if (segments.isEmpty()
                && job.getStatus() == DubbingJobStatus.COMPLETED
                && "softcatala".equalsIgnoreCase(provider)
                && StringUtils.hasText(job.getProviderJobId())) {
            List<SoftcatalaDubbingClient.UtteranceItem> utterances =
                    fetchSoftcatalaUtterancesWithRetry(job.getProviderJobId(), 3, 1500L);
            if (!utterances.isEmpty()) {
                persistSoftcatalaTimeline(job, utterances);
                segments = dubbingSegmentRepository.findByJobIdOrderByStartSecondsAsc(jobId);
            } else {
                UploadedAsset asset = uploadedAssetRepository.findById(job.getUploadId()).orElse(null);
                Path finalExport = StringUtils.hasText(job.getExportPath()) ? Paths.get(job.getExportPath()) : null;
                persistSoftcatalaFallbackTimeline(job, asset, finalExport);
                segments = dubbingSegmentRepository.findByJobIdOrderByStartSecondsAsc(jobId);
            }
        }
        boolean ready = job.getStatus() == DubbingJobStatus.COMPLETED && !segments.isEmpty();

        List<TimelineSegmentResponse> mapped = segments.stream()
                .map(seg -> new TimelineSegmentResponse(
                        seg.getId() == null ? 0 : seg.getId(),
                        seg.getSpeaker(),
                        seg.getStartSeconds(),
                        seg.getEndSeconds(),
                        seg.getText(),
                        seg.getTranslatedText(),
                        seg.getColor()
                ))
                .toList();

        return new TimelineResponse(jobId, ready, mapped);
    }

    @Transactional
    public Resource getExport(String ownerEmail, String jobId) {
        DubbingJob job = getOwnedJob(ownerEmail, jobId);

        if (job.getStatus() != DubbingJobStatus.COMPLETED || job.getExportPath() == null) {
            throw new AuthException(HttpStatus.CONFLICT, "Export is not ready yet");
        }

        Path exportPath = resolveStoredPath(job.getExportPath());
        if (!Files.exists(exportPath)) {
            throw new AuthException(HttpStatus.NOT_FOUND, "Export file is missing");
        }

        return new FileSystemResource(exportPath);
    }

    private DubbingJob getOwnedJob(String ownerEmail, String jobId) {
        return dubbingJobRepository.findByIdAndOwnerEmail(jobId, ownerEmail)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "Dubbing job not found"));
    }

    private DubbingJobResponse toJobResponse(DubbingJob job) {
        return new DubbingJobResponse(
                job.getId(),
                job.getFileName(),
                job.getSourceLanguage(),
                job.getTargetLanguage(),
                job.getVoiceModel(),
                job.getStatus().name(),
                job.getProgress(),
                job.getCurrentStep(),
                job.getCreatedAt(),
                job.getUpdatedAt(),
                job.getExportPath() != null,
                buildStepStatuses(job)
        );
    }

    private List<DubbingStepStatus> buildStepStatuses(DubbingJob job) {
        int currentIndex = PIPELINE_STEPS.indexOf(job.getCurrentStep());
        if (currentIndex < 0) {
            currentIndex = 0;
        }

        List<DubbingStepStatus> statuses = new ArrayList<>();
        for (int i = 0; i < PIPELINE_STEPS.size(); i++) {
            String status;
            if (job.getStatus() == DubbingJobStatus.COMPLETED) {
                status = "completed";
            } else if (job.getStatus() == DubbingJobStatus.FAILED && i <= currentIndex) {
                status = "completed";
            } else if (i < currentIndex) {
                status = "completed";
            } else if (i == currentIndex) {
                status = "running";
            } else {
                status = "pending";
            }
            statuses.add(new DubbingStepStatus(PIPELINE_STEPS.get(i), status));
        }

        return statuses;
    }

    private void processJob(String jobId) {
        DubbingJob job = dubbingJobRepository.findById(jobId).orElse(null);
        if (job == null || job.getStatus() != DubbingJobStatus.RUNNING) {
            LOGGER.warn("Skipping processing for job {} because it is missing or not RUNNING", jobId);
            return;
        }

        try {
            UploadedAsset asset = uploadedAssetRepository.findById(job.getUploadId())
                    .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "Upload not found"));

            if ("demo".equalsIgnoreCase(provider)) {
                processJobWithDemo(job, asset);
            } else if ("softcatala".equalsIgnoreCase(provider)) {
                processJobWithSoftcatala(job, asset);
            } else {
                processJobWithOpenAi(job, asset);
            }

            LOGGER.info("Dubbing job {} completed successfully using provider {}", jobId, provider);
        } catch (Exception ex) {
            job.setStatus(DubbingJobStatus.FAILED);
            String reason = ex.getMessage() == null ? "Unknown error" : ex.getMessage();
            if (reason.length() > 180) {
                reason = reason.substring(0, 180);
            }
            job.setCurrentStep("Failed: " + reason);
            job.setUpdatedAt(Instant.now());
            dubbingJobRepository.save(job);
            LOGGER.error("Dubbing job {} failed", jobId, ex);
        }
    }

    private void processJobWithDemo(DubbingJob job, UploadedAsset asset) throws IOException {
        Path sourcePath = resolveStoredPath(asset.getStoredPath());
        Path workDir = exportsDir.resolve(job.getId());
        Files.createDirectories(workDir);

        setStep(job, "Audio Extraction", 20);
        setStep(job, "ASR / Transcription", 45);
        setStep(job, "Translation", 65);
        setStep(job, "TTS Synthesis", 80);
        setStep(job, "Alignment", 95);

        boolean videoInput = asset.getContentType() != null && asset.getContentType().startsWith("video");
        boolean targetSpanish = isSpanishTargetLanguage(job.getTargetLanguage());
        boolean targetEnglish = isEnglishTargetLanguage(job.getTargetLanguage());

        Path finalExport;
        if (targetSpanish || targetEnglish) {
            Path dubbedSample = resolveDemoSampleForTargetLanguage(job.getTargetLanguage());
            if (dubbedSample != null && Files.exists(dubbedSample)) {
                Path dubbedAudio = workDir.resolve(job.getId() + "_dubbed.wav");
                Files.copy(dubbedSample, dubbedAudio, StandardCopyOption.REPLACE_EXISTING);
                if (videoInput) {
                    finalExport = muxAudioWithVideo(sourcePath, dubbedAudio, workDir.resolve(job.getId() + "_dubbed.mp4"));
                } else {
                    finalExport = dubbedAudio;
                }
            } else {
                finalExport = copySourceAsDemoExport(job, asset, sourcePath, workDir);
            }
        } else {
            finalExport = copySourceAsDemoExport(job, asset, sourcePath, workDir);
        }

        dubbingSegmentRepository.deleteByJobId(job.getId());
        int durationSeconds = detectDurationSeconds(sourcePath);
        if (durationSeconds <= 0) {
            durationSeconds = 60;
        }
        DubbingSegment demoSegment = new DubbingSegment(
                job.getId(),
                "Speaker A",
                0,
                durationSeconds,
                "Demo transcript generated.",
                targetSpanish
                    ? "Demo dubbed output ready in Spanish."
                    : targetEnglish
                    ? "Demo dubbed output ready in English."
                    : "Demo dubbed output ready.",
                "hsl(175, 80%, 50%)"
        );
        dubbingSegmentRepository.save(demoSegment);

        markCompleted(job, finalExport);
    }

    private void processJobWithOpenAi(DubbingJob job, UploadedAsset asset) throws IOException {
        openAiDubbingClient.assertConfigured();

        Path originalSourcePath = resolveStoredPath(asset.getStoredPath());
        Path workDir = exportsDir.resolve(job.getId());
        Files.createDirectories(workDir);

        setStep(job, "Audio Extraction", 10);
        Path preparedAudio = prepareAudioForTranscription(originalSourcePath, asset.getContentType(), workDir);

        setStep(job, "ASR / Transcription", 30);
        OpenAiDubbingClient.TranscriptionResult transcriptionResult = openAiDubbingClient.transcribe(preparedAudio, job.getSourceLanguage());

        setStep(job, "Translation", 55);
        List<String> sourceTexts = transcriptionResult.segments().stream().map(OpenAiDubbingClient.TranscriptionSegment::text).toList();
        List<String> translatedTexts = openAiDubbingClient.translateSegments(sourceTexts, job.getTargetLanguage());

        setStep(job, "TTS Synthesis", 75);
        String translatedScript = String.join(" ", translatedTexts);
        Path dubbedAudio = openAiDubbingClient.synthesizeSpeech(
                translatedScript,
                job.getVoiceModel(),
                workDir.resolve(job.getId() + "_dubbed.mp3")
        );

        setStep(job, "Alignment", 90);
        persistTimeline(job, transcriptionResult.segments(), translatedTexts);

        Path finalExport = asset.getContentType().startsWith("video")
                ? muxAudioWithVideo(originalSourcePath, dubbedAudio, workDir.resolve(job.getId() + "_dubbed.mp4"))
                : dubbedAudio;

        markCompleted(job, finalExport);
    }

    private void processJobWithSoftcatala(DubbingJob job, UploadedAsset asset) throws IOException {
        if (asset.getContentType() == null || !asset.getContentType().startsWith("video")) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Softcatala provider currently supports video uploads only");
        }

        Path workDir = exportsDir.resolve(job.getId());
        Files.createDirectories(workDir);

        setStep(job, "Audio Extraction", 10);
        SoftcatalaDubbingClient.Submission submission = softcatalaDubbingClient.submitDubbingJob(
            resolveStoredPath(asset.getStoredPath()),
                job.getOwnerEmail(),
                softcatalaVariant,
                job.getSourceLanguage(),
                false,
                false
        );
        job.setProviderJobId(submission.uuid());
        job.setUpdatedAt(Instant.now());
        dubbingJobRepository.save(job);

        setStep(job, "ASR / Transcription", 30);
        waitUntilSoftcatalaJobReady(submission.uuid());

        setStep(job, "Alignment", 90);
        Path finalExport = softcatalaDubbingClient.downloadDubbedVideo(
                submission.uuid(),
                workDir.resolve(job.getId() + "_dubbed.mp4")
        );

        List<SoftcatalaDubbingClient.UtteranceItem> utterances =
            fetchSoftcatalaUtterancesWithRetry(submission.uuid(), 8, 2000L);
        if (utterances.isEmpty()) {
            persistSoftcatalaFallbackTimeline(job, asset, finalExport);
        } else {
            persistSoftcatalaTimeline(job, utterances);
        }

        markCompleted(job, finalExport);
    }

    private void waitUntilSoftcatalaJobReady(String uuid) {
        Instant startedAt = Instant.now();
        Instant deadline = Instant.now().plus(softcatalaTimeoutMinutes, ChronoUnit.MINUTES);

        while (Instant.now().isBefore(deadline)) {
            if (softcatalaDubbingClient.isJobReady(uuid)) {
                return;
            }

            // Keep the same pipeline step label but show steady progress while queued/processing remotely.
            DubbingJob job = dubbingJobRepository.findByProviderJobId(uuid).orElse(null);
            if (job != null && job.getStatus() == DubbingJobStatus.RUNNING && "ASR / Transcription".equals(job.getCurrentStep())) {
                long timeoutSeconds = Math.max(60L, softcatalaTimeoutMinutes * 60L);
                long elapsedSeconds = Math.max(0L, ChronoUnit.SECONDS.between(startedAt, Instant.now()));

                // Move from 30 -> 95 across the configured timeout window so UI does not stall at 85.
                int computedProgress = 30 + (int) Math.min(65L, (elapsedSeconds * 65L) / timeoutSeconds);
                int bumpedProgress = Math.max(job.getProgress(), Math.min(95, computedProgress));
                job.setProgress(bumpedProgress);
                job.setUpdatedAt(Instant.now());
                dubbingJobRepository.save(job);
            }

            try {
                Thread.sleep(Math.max(1, softcatalaPollSeconds) * 1000L);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new AuthException(HttpStatus.INTERNAL_SERVER_ERROR, "Interrupted while waiting for Softcatala job");
            }
        }

        throw new AuthException(HttpStatus.GATEWAY_TIMEOUT, "Softcatala dubbing job timed out");
    }

    private void persistSoftcatalaTimeline(DubbingJob job, List<SoftcatalaDubbingClient.UtteranceItem> utterances) {
        String[] colors = new String[]{"hsl(175, 80%, 50%)", "hsl(260, 70%, 60%)", "hsl(45, 90%, 55%)", "hsl(210, 80%, 60%)"};
        List<DubbingSegment> mappedSegments = new ArrayList<>();

        for (int i = 0; i < utterances.size(); i++) {
            SoftcatalaDubbingClient.UtteranceItem utterance = utterances.get(i);
            mappedSegments.add(new DubbingSegment(
                    job.getId(),
                    utterance.speaker(),
                    utterance.startSeconds(),
                    utterance.endSeconds(),
                    utterance.text(),
                    utterance.translatedText(),
                    colors[i % colors.length]
            ));
        }

        dubbingSegmentRepository.deleteByJobId(job.getId());
        if (!mappedSegments.isEmpty()) {
            dubbingSegmentRepository.saveAll(mappedSegments);
            LOGGER.info("Persisted {} timeline segments for Softcatala job {}", mappedSegments.size(), job.getId());
        } else {
            LOGGER.warn("Softcatala timeline returned empty utterances for job {}", job.getId());
        }
    }

    private void persistSoftcatalaFallbackTimeline(DubbingJob job, UploadedAsset asset, Path finalExport) {
        int durationSeconds = detectDurationSeconds(finalExport);
        if (durationSeconds <= 0 && asset != null) {
            durationSeconds = detectDurationSeconds(Paths.get(asset.getStoredPath()));
        }
        durationSeconds = Math.max(1, durationSeconds);

        DubbingSegment fallback = new DubbingSegment(
                job.getId(),
                "Speaker A",
                0,
                durationSeconds,
                "Transcript unavailable from provider metadata.",
                "Dubbed audio generated successfully.",
                "hsl(175, 80%, 50%)"
        );

        dubbingSegmentRepository.deleteByJobId(job.getId());
        dubbingSegmentRepository.save(fallback);
        LOGGER.warn("Softcatala utterances unavailable for job {}. Persisted fallback segment.", job.getId());
    }

    private int detectDurationSeconds(Path mediaPath) {
        if (mediaPath == null || !Files.exists(mediaPath)) {
            return 0;
        }

        ProcessBuilder processBuilder = new ProcessBuilder(
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                mediaPath.toString()
        );
        processBuilder.redirectErrorStream(true);

        try {
            Process process = processBuilder.start();
            String output;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                output = reader.readLine();
            }
            int exitCode = process.waitFor();
            if (exitCode != 0 || !StringUtils.hasText(output)) {
                return 0;
            }
            return Math.max(1, (int) Math.ceil(Double.parseDouble(output.trim())));
        } catch (Exception ex) {
            return 0;
        }
    }

    private List<SoftcatalaDubbingClient.UtteranceItem> fetchSoftcatalaUtterancesWithRetry(String uuid, int maxAttempts, long sleepMs) {
        List<SoftcatalaDubbingClient.UtteranceItem> utterances = List.of();
        for (int attempt = 1; attempt <= Math.max(1, maxAttempts); attempt++) {
            utterances = softcatalaDubbingClient.getUtterances(uuid);
            if (!utterances.isEmpty()) {
                return utterances;
            }

            if (attempt < maxAttempts) {
                try {
                    Thread.sleep(Math.max(250L, sleepMs));
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        return utterances;
    }

    private void markCompleted(DubbingJob job, Path finalExport) {
        job.setStatus(DubbingJobStatus.COMPLETED);
        job.setProgress(100);
        job.setCurrentStep(PIPELINE_STEPS.get(PIPELINE_STEPS.size() - 1));
        job.setExportPath(finalExport.toString());
        job.setUpdatedAt(Instant.now());
        dubbingJobRepository.save(job);
    }

    private void setStep(DubbingJob job, String step, int progress) {
        job.setCurrentStep(step);
        job.setProgress(progress);
        job.setUpdatedAt(Instant.now());
        dubbingJobRepository.save(job);
    }

    private void maybeMarkStaleFailed(DubbingJob job) {
        if (job.getStatus() != DubbingJobStatus.RUNNING) {
            return;
        }

        Instant cutoff = Instant.now().minus(Math.max(1, staleRunningTimeoutMinutes), ChronoUnit.MINUTES);
        if (!job.getUpdatedAt().isBefore(cutoff)) {
            return;
        }

        job.setStatus(DubbingJobStatus.FAILED);
        job.setCurrentStep("Job timed out while waiting for provider. Please retry.");
        job.setUpdatedAt(Instant.now());
        dubbingJobRepository.save(job);
        LOGGER.warn("Marked stale RUNNING job {} as FAILED after {} minutes without updates", job.getId(), staleRunningTimeoutMinutes);
    }

    @Scheduled(fixedDelayString = "${dubflow.ai.stale-scan-interval-ms:60000}")
    @Transactional
    public void reconcileStaleRunningJobs() {
        Instant cutoff = Instant.now().minus(Math.max(1, staleRunningTimeoutMinutes), ChronoUnit.MINUTES);
        List<DubbingJob> staleJobs = dubbingJobRepository.findByStatusAndUpdatedAtBefore(DubbingJobStatus.RUNNING, cutoff);
        for (DubbingJob job : staleJobs) {
            job.setStatus(DubbingJobStatus.FAILED);
            job.setCurrentStep("Job timed out while waiting for provider. Please retry.");
            job.setUpdatedAt(Instant.now());
            dubbingJobRepository.save(job);
            LOGGER.warn("Auto-reconciled stale RUNNING job {} to FAILED", job.getId());
        }
    }

    private Path prepareAudioForTranscription(Path sourcePath, String contentType, Path workDir) throws IOException {
        if (contentType != null && contentType.startsWith("video")) {
            Path extracted = workDir.resolve("source-audio.wav");
            runProcess(
                    List.of("ffmpeg", "-y", "-i", sourcePath.toString(), "-vn", "-ac", "1", "-ar", "16000", extracted.toString()),
                    "Audio extraction failed. Ensure ffmpeg is installed and available on PATH."
            );
            return extracted;
        }
        return sourcePath;
    }

    private Path muxAudioWithVideo(Path sourceVideo, Path dubbedAudio, Path outputVideo) throws IOException {
        runProcess(
                List.of(
                        "ffmpeg",
                        "-y",
                        "-i",
                        sourceVideo.toString(),
                        "-i",
                        dubbedAudio.toString(),
                        "-map",
                        "0:v:0",
                        "-map",
                        "1:a:0",
                        "-c:v",
                        "copy",
                        "-shortest",
                        outputVideo.toString()
                ),
                "Video muxing failed. Ensure ffmpeg is installed and available on PATH."
        );
        return outputVideo;
    }

    private void persistTimeline(
            DubbingJob job,
            List<OpenAiDubbingClient.TranscriptionSegment> segments,
            List<String> translatedTexts
    ) {
        String[] colors = new String[]{"hsl(175, 80%, 50%)", "hsl(260, 70%, 60%)", "hsl(45, 90%, 55%)", "hsl(210, 80%, 60%)"};

        List<DubbingSegment> mappedSegments = new ArrayList<>();
        for (int i = 0; i < segments.size(); i++) {
            OpenAiDubbingClient.TranscriptionSegment seg = segments.get(i);
            String translated = i < translatedTexts.size() ? translatedTexts.get(i) : seg.text();
            mappedSegments.add(
                    new DubbingSegment(
                            job.getId(),
                            seg.speaker(),
                            seg.startSeconds(),
                            seg.endSeconds(),
                            seg.text(),
                            translated,
                            colors[i % colors.length]
                    )
            );
        }

        dubbingSegmentRepository.deleteByJobId(job.getId());
        dubbingSegmentRepository.saveAll(mappedSegments);
    }

    private void runProcess(List<String> command, String failureMessage) throws IOException {
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);
        Process process = processBuilder.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append('\n');
            }
        }

        try {
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new AuthException(HttpStatus.INTERNAL_SERVER_ERROR, failureMessage + " " + output);
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new AuthException(HttpStatus.INTERNAL_SERVER_ERROR, failureMessage);
        }
    }

    private Path resolveStoredPath(String storedPath) {
        if (!StringUtils.hasText(storedPath)) {
            return Paths.get("");
        }

        Path path = Paths.get(storedPath).normalize();
        if (path.isAbsolute()) {
            return path;
        }

        Path fromBackendRoot = backendProjectDir.resolve(path).normalize();
        if (Files.exists(fromBackendRoot)) {
            return fromBackendRoot;
        }

        Path fromCwd = Paths.get("").toAbsolutePath().normalize().resolve(path).normalize();
        if (Files.exists(fromCwd)) {
            return fromCwd;
        }

        return fromBackendRoot;
    }

    private String normalizeSourceLanguageForSoftcatala(String sourceLanguage) {
        String normalized = sourceLanguage == null ? "" : sourceLanguage.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "eng", "en", "english" -> "eng";
            case "spa", "es", "spanish", "castilian" -> "spa";
            case "auto" -> "auto";
            default -> throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "Softcatala provider currently supports sourceLanguage: auto, eng (or en), spa (or es)"
            );
        };
    }

    private String getFileExtension(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return "";
        }
        int idx = fileName.lastIndexOf('.');
        if (idx < 0 || idx == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(idx + 1);
    }

    private boolean isSpanishTargetLanguage(String targetLanguage) {
        if (!StringUtils.hasText(targetLanguage)) {
            return false;
        }
        String normalized = targetLanguage.trim().toLowerCase(Locale.ROOT);
        return "es".equals(normalized)
                || "spa".equals(normalized)
                || "spanish".equals(normalized)
                || "ca".equals(normalized)
                || "cat".equals(normalized)
                || "catalan".equals(normalized);
    }

    private boolean isEnglishTargetLanguage(String targetLanguage) {
        if (!StringUtils.hasText(targetLanguage)) {
            return false;
        }
        String normalized = targetLanguage.trim().toLowerCase(Locale.ROOT);
        return "en".equals(normalized)
                || "eng".equals(normalized)
                || "english".equals(normalized);
    }

    private Path resolveDemoSpanishSamplePath() {
        Path workspaceRoot = backendProjectDir.getParent() != null ? backendProjectDir.getParent() : backendProjectDir;
        return workspaceRoot.resolve("public").resolve("demo-audio").resolve("spanish-sample.wav").normalize();
    }

    private Path resolveDemoEnglishSamplePath() {
        Path workspaceRoot = backendProjectDir.getParent() != null ? backendProjectDir.getParent() : backendProjectDir;
        return workspaceRoot.resolve("public").resolve("demo-audio").resolve("english-sample.wav").normalize();
    }

    private Path resolveDemoSampleForTargetLanguage(String targetLanguage) {
        if (isSpanishTargetLanguage(targetLanguage)) {
            return resolveDemoSpanishSamplePath();
        }
        if (isEnglishTargetLanguage(targetLanguage)) {
            return resolveDemoEnglishSamplePath();
        }
        return null;
    }

    private Path copySourceAsDemoExport(DubbingJob job, UploadedAsset asset, Path sourcePath, Path workDir) throws IOException {
        String extension = getFileExtension(asset.getOriginalFileName());
        if (!StringUtils.hasText(extension)) {
            extension = asset.getContentType() != null && asset.getContentType().startsWith("audio") ? "mp3" : "mp4";
        }
        Path finalExport = workDir.resolve(job.getId() + "_dubbed." + extension.toLowerCase(Locale.ROOT));
        Files.copy(sourcePath, finalExport, StandardCopyOption.REPLACE_EXISTING);
        return finalExport;
    }
}
