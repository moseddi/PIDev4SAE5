package com.example.career.controller;

import com.example.career.entity.Application;
import com.example.career.entity.ApplicationStatus;
import com.example.career.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/applications")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
@Slf4j
public class ApplicationController {

    private final ApplicationService service;

    @GetMapping
    public ResponseEntity<List<Application>> getAll() {
        log.info("[GET] /applications - Fetching all applications");
        List<Application> apps = service.getAllApplications();
        log.info("[GET] /applications - Found {} applications", apps.size());
        return ResponseEntity.ok(apps);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Application> getById(@PathVariable Long id) {
        Application application = service.getApplicationById(id);
        return application != null ? ResponseEntity.ok(application) : ResponseEntity.notFound().build();
    }

    /**
     * Endpoint for students to fetch their own applications.
     * The userId is passed as a query param: GET /applications/my?userId=X
     * Since we don't have JWT-based auth extracting user, we accept userId as param
     * and also return ALL applications as fallback.
     */
    @GetMapping("/my")
    public ResponseEntity<List<Application>> getMyApplications(
            @RequestParam(required = false) Long userId) {
        log.info("[GET] /applications/my - userId={}", userId);
        if (userId != null) {
            return ResponseEntity.ok(service.getByUserId(userId));
        }
        // Fallback: return all applications (when no userId filtering is available)
        log.info("[GET] /applications/my - No userId provided, returning all applications");
        return ResponseEntity.ok(service.getAllApplications());
    }

    /**
     * Create a new application.
     * Accepts a JSON body that may include a "jobOfferId" field
     * (sent by the Angular frontend) which is used to look up and link the JobOffer.
     */
    @PostMapping
    public ResponseEntity<Application> create(@RequestBody Map<String, Object> body) {
        log.info("[POST] /applications - Received payload: {}", body);

        Application application = new Application();
        application.setBio((String) body.get("bio"));
        application.setSpecialty((String) body.get("specialty"));
        application.setExperience((String) body.get("experience"));

        // Extract userId if provided
        if (body.get("userId") != null) {
            application.setUserId(((Number) body.get("userId")).longValue());
        }

        // Extract jobOfferId
        Long jobOfferId = null;
        if (body.get("jobOfferId") != null) {
            jobOfferId = ((Number) body.get("jobOfferId")).longValue();
        }

        Application saved = service.saveApplication(application, jobOfferId);
        if (saved == null) {
            log.error("[POST] /applications - Failed to save application");
            return ResponseEntity.internalServerError().build();
        }
        log.info("[POST] /applications - Created application id={}, jobOffer={}", 
                saved.getId(), 
                saved.getJobOffer() != null ? saved.getJobOffer().getTitle() : "null");
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Application> update(@PathVariable Long id, @RequestBody Application application) {
        Application updated = service.updateApplication(id, application);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteApplication(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAll() {
        service.deleteAllApplications();
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Application> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().build();
        }
        Application updated = service.updateStatus(id, ApplicationStatus.valueOf(statusStr));
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @GetMapping("/job-offer/{jobOfferId}")
    public ResponseEntity<List<Application>> getByJobOffer(@PathVariable Long jobOfferId) {
        return ResponseEntity.ok(service.getByJobOfferId(jobOfferId));
    }
}
