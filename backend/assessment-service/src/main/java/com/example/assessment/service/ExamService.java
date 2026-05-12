package com.example.assessment.service;

import com.example.assessment.entity.Exam;
import com.example.assessment.repository.ExamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ExamService {

    private final ExamRepository repository;

    public List<Exam> getAll() {
        log.info("Fetching all exams");
        return repository.findAll();
    }

    public Exam save(Exam exam) {
        log.info("Saving new exam: {}", exam.getTitle());
        return repository.save(exam);
    }

    public void delete(Long id) {
        log.info("Deleting exam with id: {}", id);
        repository.deleteById(id);
    }

    public Exam getById(Long id) {
        log.info("Fetching exam with id: {}", id);
        return repository.findById(id).orElse(null);
    }

    public Exam getByIdOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> {
                    log.error("Exam not found with id: {}", id);
                    return new RuntimeException("Exam not found with id: " + id);
                });
    }

    @Transactional
    public Exam update(Long id, Exam examDetails) {
        log.info("Updating exam with id: {}", id);
        Exam existingExam = getByIdOrThrow(id);

        existingExam.setTitle(examDetails.getTitle());
        existingExam.setDescription(examDetails.getDescription());
        existingExam.setDuration(examDetails.getDuration());
        existingExam.setExamType(examDetails.getExamType());

        if (examDetails.getQuestions() != null) {
            existingExam.getQuestions().clear();
            existingExam.getQuestions().addAll(examDetails.getQuestions());
            for (var question : existingExam.getQuestions()) {
                question.setExam(existingExam);
            }
        }

        return repository.save(existingExam);
    }

    @Transactional
    public Exam updateSafe(Long id, Exam examDetails) {
        log.info("Safe updating exam with id: {}", id);
        Exam existingExam = getByIdOrThrow(id);

        existingExam.setTitle(examDetails.getTitle());
        existingExam.setDescription(examDetails.getDescription());
        existingExam.setDuration(examDetails.getDuration());
        existingExam.setExamType(examDetails.getExamType());

        return repository.save(existingExam);
    }
}