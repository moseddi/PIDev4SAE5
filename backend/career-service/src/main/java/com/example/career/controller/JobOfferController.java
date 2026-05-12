package com.example.career.controller;

import com.example.career.entity.JobOffer;
import com.example.career.service.JobOfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/job-offers")
@CrossOrigin(origins ="http://localhost:4200")
@RequiredArgsConstructor
public class JobOfferController {

    private final JobOfferService service;

    @GetMapping
    public ResponseEntity<List<JobOffer>> getAll() {
        return ResponseEntity.ok(service.getAllOffers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobOffer> getById(@PathVariable Long id) {
        JobOffer offer = service.getOfferById(id);
        return offer != null ? ResponseEntity.ok(offer) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<JobOffer> create(@RequestBody JobOffer offer) {
        return ResponseEntity.ok(service.saveOffer(offer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobOffer> update(@PathVariable Long id, @RequestBody JobOffer offer) {
        JobOffer updated = service.updateOffer(id, offer);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteOffer(id);
        return ResponseEntity.noContent().build();
    }
}
