package com.dubflow.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "uploaded_assets")
public class UploadedAsset {

    @Id
    @Column(nullable = false, updatable = false, length = 36)
    private String id;

    @Column(nullable = false)
    private String ownerEmail;

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private long sizeBytes;

    @Column(nullable = false)
    private String storedPath;

    @Column(nullable = false)
    private Instant createdAt;

    protected UploadedAsset() {
        // Required by JPA.
    }

    public UploadedAsset(String id, String ownerEmail, String originalFileName, String contentType, long sizeBytes, String storedPath, Instant createdAt) {
        this.id = id;
        this.ownerEmail = ownerEmail;
        this.originalFileName = originalFileName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.storedPath = storedPath;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public String getStoredPath() {
        return storedPath;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
