package com.dubflow.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "dubbing_jobs")
public class DubbingJob {

    @Id
    @Column(nullable = false, updatable = false, length = 36)
    private String id;

    @Column(nullable = false)
    private String ownerEmail;

    @Column(nullable = false)
    private String uploadId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String sourceLanguage;

    @Column(nullable = false)
    private String targetLanguage;

    @Column(nullable = false)
    private String voiceModel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DubbingJobStatus status;

    @Column(nullable = false)
    private int progress;

    @Column(nullable = false)
    private String currentStep;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column
    private String exportPath;

    @Column
    private String providerJobId;

    protected DubbingJob() {
        // Required by JPA.
    }

    public DubbingJob(
            String id,
            String ownerEmail,
            String uploadId,
            String fileName,
            String sourceLanguage,
            String targetLanguage,
            String voiceModel,
            DubbingJobStatus status,
            int progress,
            String currentStep,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.ownerEmail = ownerEmail;
        this.uploadId = uploadId;
        this.fileName = fileName;
        this.sourceLanguage = sourceLanguage;
        this.targetLanguage = targetLanguage;
        this.voiceModel = voiceModel;
        this.status = status;
        this.progress = progress;
        this.currentStep = currentStep;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public String getUploadId() {
        return uploadId;
    }

    public String getFileName() {
        return fileName;
    }

    public String getSourceLanguage() {
        return sourceLanguage;
    }

    public String getTargetLanguage() {
        return targetLanguage;
    }

    public String getVoiceModel() {
        return voiceModel;
    }

    public DubbingJobStatus getStatus() {
        return status;
    }

    public void setStatus(DubbingJobStatus status) {
        this.status = status;
    }

    public int getProgress() {
        return progress;
    }

    public void setProgress(int progress) {
        this.progress = progress;
    }

    public String getCurrentStep() {
        return currentStep;
    }

    public void setCurrentStep(String currentStep) {
        this.currentStep = currentStep;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getExportPath() {
        return exportPath;
    }

    public void setExportPath(String exportPath) {
        this.exportPath = exportPath;
    }

    public String getProviderJobId() {
        return providerJobId;
    }

    public void setProviderJobId(String providerJobId) {
        this.providerJobId = providerJobId;
    }
}
