package com.example.quiz.controller;
import com.example.quiz.entity.QuizQuestion;
import com.example.quiz.service.QuizQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quiz-questions")
@RequiredArgsConstructor
public class QuizQuestionController {

    private final QuizQuestionService service;

    @GetMapping
    public ResponseEntity<List<QuizQuestion>> getAll() {
        return ResponseEntity.ok(service.getAllQuestions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizQuestion> getById(@PathVariable Long id) {
        QuizQuestion question = service.getQuestionById(id);
        return question != null ? ResponseEntity.ok(question) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<QuizQuestion> create(@RequestBody QuizQuestion question) {
        return ResponseEntity.ok(service.saveQuestion(question));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuizQuestion> update(@PathVariable Long id, @RequestBody QuizQuestion question) {
        QuizQuestion updated = service.updateQuestion(id, question);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}

