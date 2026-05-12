package com.example.quiz.controller;
import com.example.quiz.entity.GameSession;
import com.example.quiz.entity.GameStatus;
import com.example.quiz.entity.Score;
import com.example.quiz.service.GameSessionService;
import com.example.quiz.service.GameEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/game-sessions")
@RequiredArgsConstructor
public class GameSessionController {

    private final GameSessionService service;
    private final GameEventService gameEventService;

    @GetMapping
    public ResponseEntity<List<GameSession>> getAll() {
        return ResponseEntity.ok(service.getAllSessions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameSession> getById(@PathVariable Long id) {
        GameSession session = service.getSessionById(id);
        return session != null ? ResponseEntity.ok(session) : ResponseEntity.notFound().build();
    }

    @GetMapping("/pin/{pin}")
    public ResponseEntity<GameSession> getByPin(@PathVariable String pin) {
        GameSession session = service.getSessionByPin(pin);
        return session != null ? ResponseEntity.ok(session) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<GameSession> create(@RequestBody GameSession session) {
        return ResponseEntity.ok(service.createSession(session));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<GameSession> updateStatus(@PathVariable Long id, @RequestParam GameStatus status) {
        GameSession updated = service.updateStatus(id, status);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<GameSession> update(@PathVariable Long id, @RequestBody GameSession session) {
        GameSession updated = service.updateSession(id, session);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    // Returns the persistent scores (for history/finished games)
    @GetMapping("/{id}/players")
    public ResponseEntity<List<Score>> getPlayers(@PathVariable Long id) {
        GameSession session = service.getSessionById(id);
        return session != null ? ResponseEntity.ok(session.getScores()) : ResponseEntity.notFound().build();
    }

    // Returns active players in the lobby (real-time from memory)
    @GetMapping("/{id}/active-players")
    public ResponseEntity<List<String>> getActivePlayers(@PathVariable Long id) {
        return ResponseEntity.ok(gameEventService.getPlayers(id));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<Void> startGame(@PathVariable Long id) {
        gameEventService.startGame(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<Void> endGame(@PathVariable Long id) {
        gameEventService.endGame(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/next-question")
    public ResponseEntity<Void> nextQuestion(@PathVariable Long id) {
        gameEventService.nextQuestion(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Map<String, Object>> joinSession(
            @PathVariable Long id,
            @RequestParam String name) {
        return ResponseEntity.ok(gameEventService.playerJoin(id, name));
    }
}

