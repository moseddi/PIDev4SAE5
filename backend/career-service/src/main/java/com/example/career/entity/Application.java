package com.example.career.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status;

    private Long userId;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String specialty;

    private String experience;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "job_offer_id")
    @JsonIgnoreProperties("applications")
    private JobOffer jobOffer;

    public Application() {
        // Empty constructor for JPA
    }

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = ApplicationStatus.PENDING;
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public JobOffer getJobOffer() { return jobOffer; }
    public void setJobOffer(JobOffer jobOffer) { this.jobOffer = jobOffer; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
