package com.example.quiz.service;

import com.example.quiz.entity.QuizQuestion;
import com.example.quiz.repository.QuizQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizQuestionService {

    private final QuizQuestionRepository repository;

    public List<QuizQuestion> getAllQuestions() {
        log.info("Fetching all quiz questions");
        return repository.findAll();
    }

    public QuizQuestion getQuestionById(Long id) {
        log.info("Fetching question with id: {}", id);
        return repository.findById(id).orElse(null);
    }

    public QuizQuestion saveQuestion(QuizQuestion question) {
        log.info("Saving new quiz question");
        return repository.save(question);
    }

    public QuizQuestion updateQuestion(Long id, QuizQuestion questionDetails) {
        log.info("Updating question with id: {}", id);
        return repository.findById(id).map(question -> {
            question.setContent(questionDetails.getContent());
            question.setTimeLimit(questionDetails.getTimeLimit());
            question.setOptions(questionDetails.getOptions());
            question.setQuiz(questionDetails.getQuiz());
            return repository.save(question);
        }).orElseGet(() -> {
            log.warn("Question not found with id: {}", id);
            return null;
        });
    }

    public void deleteQuestion(Long id) {
        log.info("Deleting question with id: {}", id);
        repository.deleteById(id);
    }
}
