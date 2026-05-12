package com.example.quiz.controller;

import com.example.quiz.entity.Score;
import com.example.quiz.service.ScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService service;

    @GetMapping
    public ResponseEntity<List<Score>> getAll() {
        return ResponseEntity.ok(service.getAllScores());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Score> getById(@PathVariable Long id) {
        Score score = service.getScoreById(id);
        return score != null ? ResponseEntity.ok(score) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Score> create(@RequestBody Score score) {
        return ResponseEntity.ok(service.saveScore(score));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Score> update(@PathVariable Long id, @RequestBody Score score) {
        Score updated = service.updateScore(id, score);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteScore(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<Score>> getBySessionId(@PathVariable Long sessionId) {
        return ResponseEntity.ok(service.getScoresBySessionId(sessionId));
    }
}
