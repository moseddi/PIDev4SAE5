package com.example.career.entity;

import jakarta.persistence.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
public class JobOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;

    @Enumerated(EnumType.STRING)
    private Level requiredLevel;

    private boolean active;

    private String companyName;
    private String location;
    private String contractType;
    private Double salary;
    private String status;
    private String publicationDate;
    private String expirationDate;

    @OneToMany(mappedBy = "jobOffer", cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("jobOffer")
    private List<Application> applications;

    public JobOffer() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Level getRequiredLevel() { return requiredLevel; }
    public void setRequiredLevel(Level requiredLevel) { this.requiredLevel = requiredLevel; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getContractType() { return contractType; }
    public void setContractType(String contractType) { this.contractType = contractType; }

    public Double getSalary() { return salary; }
    public void setSalary(Double salary) { this.salary = salary; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPublicationDate() { return publicationDate; }
    public void setPublicationDate(String publicationDate) { this.publicationDate = publicationDate; }

    public String getExpirationDate() { return expirationDate; }
    public void setExpirationDate(String expirationDate) { this.expirationDate = expirationDate; }

    public List<Application> getApplications() { return applications; }
    public void setApplications(List<Application> applications) { this.applications = applications; }
}