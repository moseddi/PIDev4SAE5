package com.example.assessment.service;

import com.example.assessment.entity.Attempt;
import com.example.assessment.repository.AttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttemptService {

    private static final String ATTEMPT_NOT_FOUND = "Attempt not found with id: ";
    private final AttemptRepository repo;

    // CREATE
    public Attempt save(Attempt attempt) {
        log.info("Saving new attempt");
        return repo.save(attempt);
    }

    // UPDATE
    public Attempt update(Attempt attempt) {
        log.info("Updating attempt with id: {}", attempt.getId());
        if (!repo.existsById(attempt.getId())) {
            log.error(ATTEMPT_NOT_FOUND + "{}", attempt.getId());
            throw new IllegalArgumentException(ATTEMPT_NOT_FOUND + attempt.getId());
        }

        return repo.save(attempt);
    }

    // DELETE
    public void delete(Long id) {
        log.info("Deleting attempt with id: {}", id);
        if (!repo.existsById(id)) {
            log.error(ATTEMPT_NOT_FOUND + "{}", id);
            throw new IllegalArgumentException(ATTEMPT_NOT_FOUND + id);
        }
        repo.deleteById(id);
    }

    // READ ALL
    public List<Attempt> getAll() {
        log.info("Fetching all attempts");
        return repo.findAll();
    }

    // READ BY ID
    public Attempt getById(Long id) {
        log.info("Fetching attempt with id: {}", id);
        return repo.findById(id)
                .orElseThrow(() -> {
                    log.error(ATTEMPT_NOT_FOUND + "{}", id);
                    return new IllegalArgumentException(ATTEMPT_NOT_FOUND + id);
                });
    }

    // READ BY USER ID
    public List<Attempt> getByUserId(Long userId) {
        log.info("Fetching attempts for user id: {}", userId);
        return repo.findByUserId(userId);
    }

    public Attempt submitExam(com.example.assessment.Dto.SubmitExamPayload payload, 
                              com.example.assessment.repository.ExamRepository examRepo,
                              com.example.assessment.repository.AnswerRepository answerRepo) {
        
        com.example.assessment.entity.Exam exam = examRepo.findById(payload.getExamId())
                .orElseThrow(() -> new IllegalArgumentException("Exam not found"));

        int totalQuestions = exam.getQuestions().size();
        if (totalQuestions == 0) totalQuestions = 1; // Prevent div by zero

        int correctAnswersCount = 0;

        for (com.example.assessment.Dto.SubmitAnswerDto sa : payload.getAnswers()) {
            if (sa.getAnswerId() == null || sa.getAnswerId() == 0) continue;
            
            // On cherche la bonne réponse pour la question donnée
            List<com.example.assessment.entity.Answer> dbAnswers = answerRepo.findByQuestionId(sa.getQuestionId());
            boolean isCorrect = dbAnswers.stream()
                .filter(a -> a.getId().equals(sa.getAnswerId()))
                .map(com.example.assessment.entity.Answer::isCorrect)
                .findFirst()
                .orElse(false);
            
            if (isCorrect) {
                correctAnswersCount++;
            }
        }

        int score = (correctAnswersCount * 100) / totalQuestions;
        int passingScore = exam.getPassingScore() != null ? exam.getPassingScore() : 50;
        boolean passed = score >= passingScore;

        Attempt attempt = new Attempt();
        attempt.setExam(exam);
        attempt.setUserId(payload.getUserId());
        attempt.setStudentName(payload.getStudentName());
        attempt.setScore(score);
        attempt.setPassed(passed);
        attempt.setDate(java.time.LocalDateTime.now());

        return repo.save(attempt);
    }
}

