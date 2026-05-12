package com.example.assessment.service;

import com.example.assessment.entity.Question;
import com.example.assessment.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository repository;

    @Autowired
    private com.example.assessment.repository.ExamRepository examRepository;

    public Question getById(Long id) {
        Optional<Question> question = repository.findById(id);
        return question.orElse(null);
    }

    public List<Question> getAll() {
        return repository.findAll();
    }

    public Question save(Question question) {
        if (question.getExam() != null && question.getExam().getId() != null) {
            com.example.assessment.entity.Exam exam = examRepository.findById(question.getExam().getId())
                .orElseThrow(() -> new IllegalArgumentException("Exam not found"));
            question.setExam(exam);
        }
        return repository.save(question);
    }

    public Question update(Question question) {
        Question existingQuestion = getById(question.getId());
        if (existingQuestion != null) {
            existingQuestion.setContent(question.getContent());
            existingQuestion.setType(question.getType());
            existingQuestion.setExam(question.getExam());
            return repository.save(existingQuestion);
        }
        return null;
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<Question> findByExamId(Long examId) {
        return repository.findByExamId(examId);
    }

    // Méthode avec exception (comme dans ExamService)
    public Question getByIdOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found with id: " + id));
    }

    // Méthode pour compter (optionnel)
    public long countByExamId(Long examId) {
        return repository.countByExamId(examId);
    }

    // Méthode pour supprimer toutes les questions d'un examen (optionnel)
    public void deleteByExamId(Long examId) {
        repository.deleteByExamId(examId);
    }
}