package com.dubflow.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "dubbing_segments")
public class DubbingSegment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String jobId;

    @Column(nullable = false)
    private String speaker;

    @Column(nullable = false)
    private int startSeconds;

    @Column(nullable = false)
    private int endSeconds;

    @Column(nullable = false, length = 1000)
    private String text;

    @Column(nullable = false, length = 1000)
    private String translatedText;

    @Column(nullable = false)
    private String color;

    protected DubbingSegment() {
        // Required by JPA.
    }

    public DubbingSegment(String jobId, String speaker, int startSeconds, int endSeconds, String text, String translatedText, String color) {
        this.jobId = jobId;
        this.speaker = speaker;
        this.startSeconds = startSeconds;
        this.endSeconds = endSeconds;
        this.text = text;
        this.translatedText = translatedText;
        this.color = color;
    }

    public Long getId() {
        return id;
    }

    public String getJobId() {
        return jobId;
    }

    public String getSpeaker() {
        return speaker;
    }

    public int getStartSeconds() {
        return startSeconds;
    }

    public int getEndSeconds() {
        return endSeconds;
    }

    public String getText() {
        return text;
    }

    public String getTranslatedText() {
        return translatedText;
    }

    public String getColor() {
        return color;
    }
}
