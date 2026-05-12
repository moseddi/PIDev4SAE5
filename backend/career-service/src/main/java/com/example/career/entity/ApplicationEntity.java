package com.example.career.entity;

import jakarta.persistence.*;

@Entity
public class ApplicationEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String status; // PENDING / ACCEPTED / REJECTED

    @ManyToOne
    @JoinColumn(name = "job_offer_id")
    private JobOffer jobOffer;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public JobOffer getJobOffer() { return jobOffer; }
    public void setJobOffer(JobOffer jobOffer) { this.jobOffer = jobOffer; }
}
