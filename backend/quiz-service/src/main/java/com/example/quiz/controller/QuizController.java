package com.example.quiz.controller;

import com.example.quiz.entity.Quiz;
import com.example.quiz.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService service;

    @GetMapping
    public ResponseEntity<List<Quiz>> getAll() {
        return ResponseEntity.ok(service.getAllQuizzes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quiz> getById(@PathVariable Long id) {
        Quiz quiz = service.getQuizById(id);
        return quiz != null ? ResponseEntity.ok(quiz) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Quiz> create(@RequestBody Quiz quiz) {
        return ResponseEntity.ok(service.saveQuiz(quiz));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Quiz> update(@PathVariable Long id, @RequestBody Quiz quiz) {
        Quiz updated = service.updateQuiz(id, quiz);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteQuiz(id);
        return ResponseEntity.noContent().build();
    }
}

