package com.example.career.service;

import com.example.career.entity.JobOffer;
import com.example.career.repository.JobOfferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobOfferService {

    private final JobOfferRepository repository;

    public List<JobOffer> getAllOffers() {
        log.info("Fetching all job offers");
        return repository.findAll();
    }

    public JobOffer getOfferById(Long id) {
        log.info("Fetching job offer with id: {}", id);
        return repository.findById(id).orElse(null);
    }

    public JobOffer saveOffer(JobOffer offer) {
        log.info("Saving new job offer: {}", offer.getTitle());
        return repository.save(offer);
    }

    public JobOffer updateOffer(Long id, JobOffer offerDetails) {
        log.info("Updating job offer with id: {}", id);
        return repository.findById(id).map(offer -> {
            offer.setTitle(offerDetails.getTitle());
            offer.setDescription(offerDetails.getDescription());
            offer.setRequiredLevel(offerDetails.getRequiredLevel());
            offer.setActive(offerDetails.isActive());
            return repository.save(offer);
        }).orElse(null);
    }

    public void deleteOffer(Long id) {
        log.info("Deleting job offer with id: {}", id);
        repository.deleteById(id);
    }
}
