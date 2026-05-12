package com.example.quiz.service;

import com.example.quiz.entity.Quiz;
import com.example.quiz.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    private final QuizRepository repository;

    public List<Quiz> getAllQuizzes() {
        log.info("Fetching all quizzes");
        return repository.findAll();
    }

    public Quiz getQuizById(Long id) {
        log.info("Fetching quiz with id: {}", id);
        return repository.findById(id).orElse(null);
    }

    public Quiz saveQuiz(Quiz quiz) {
        log.info("Saving new quiz: {}", quiz.getTitle());
        // Set back-references for questions and their answers to ensure proper JPA cascading
        if (quiz.getQuestions() != null) {
            quiz.getQuestions().forEach(q -> {
                q.setQuiz(quiz);
                if (q.getAnswers() != null) {
                    q.getAnswers().forEach(a -> a.setQuestion(q));
                }
            });
        }
        return repository.save(quiz);
    }

    public Quiz updateQuiz(Long id, Quiz quizDetails) {
        log.info("Updating quiz with id: {}", id);
        return repository.findById(id).map(quiz -> {
            quiz.setTitle(quizDetails.getTitle());
            quiz.setDescription(quizDetails.getDescription());
            quiz.setCreatedBy(quizDetails.getCreatedBy());
            return repository.save(quiz);
        }).orElseGet(() -> {
            log.warn("Quiz not found with id: {}", id);
            return null;
        });
    }

    public void deleteQuiz(Long id) {
        log.info("Deleting quiz with id: {}", id);
        repository.deleteById(id);
    }
}
