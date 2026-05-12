package com.example.career.service;

import com.example.career.entity.Application;
import com.example.career.entity.ApplicationStatus;
import com.example.career.entity.JobOffer;
import com.example.career.repository.ApplicationRepository;
import com.example.career.repository.JobOfferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationService {

    private final ApplicationRepository repository;
    private final JobOfferRepository jobOfferRepository;

    public List<Application> getAllApplications() {
        log.info("Fetching all applications");
        return repository.findAll();
    }

    public Application getApplicationById(Long id) {
        log.info("Fetching application with id: {}", id);
        return repository.findById(id).orElse(null);
    }

    public List<Application> getByUserId(Long userId) {
        log.info("Fetching applications for user id: {}", userId);
        return repository.findByUserId(userId);
    }

    /**
     * Save a new application.
     * If jobOffer is null but a jobOfferId is provided via the transient setter,
     * we look up the JobOffer from the database before saving.
     */
    public Application saveApplication(Application application, Long jobOfferId) {
        log.info("Saving new application, jobOfferId={}", jobOfferId);

        // If jobOffer object was not set but jobOfferId was provided, look it up
        if (application.getJobOffer() == null && jobOfferId != null) {
            JobOffer offer = jobOfferRepository.findById(jobOfferId).orElse(null);
            if (offer != null) {
                application.setJobOffer(offer);
                log.info("Linked application to job offer: {} (id={})", offer.getTitle(), offer.getId());
            } else {
                log.warn("JobOffer with id {} not found!", jobOfferId);
            }
        }

        // Ensure default status
        if (application.getStatus() == null) {
            application.setStatus(ApplicationStatus.PENDING);
        }

        return repository.save(application);
    }

    public Application saveApplication(Application application) {
        return saveApplication(application, null);
    }

    public Application updateApplication(Long id, Application appDetails) {
        log.info("Updating application with id: {}", id);
        return repository.findById(id).map(application -> {
            application.setStatus(appDetails.getStatus());
            application.setUserId(appDetails.getUserId());
            application.setJobOffer(appDetails.getJobOffer());
            return repository.save(application);
        }).orElse(null);
    }

    public void deleteApplication(Long id) {
        log.info("Deleting application with id: {}", id);
        repository.deleteById(id);
    }

    public void deleteAllApplications() {
        log.info("Deleting all applications");
        repository.deleteAll();
    }

    public Application updateStatus(Long id, ApplicationStatus status) {
        log.info("Updating status for application id: {} to {}", id, status);
        return repository.findById(id).map(application -> {
            application.setStatus(status);
            return repository.save(application);
        }).orElse(null);
    }

    public List<Application> getByJobOfferId(Long jobOfferId) {
        log.info("Fetching applications for job offer id: {}", jobOfferId);
        return repository.findByJobOfferId(jobOfferId);
    }
}
