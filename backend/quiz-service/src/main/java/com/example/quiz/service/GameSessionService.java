package com.example.quiz.service;

import com.example.quiz.entity.GameSession;
import com.example.quiz.entity.GameStatus;
import com.example.quiz.repository.GameSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameSessionService {

    private final GameSessionRepository repository;
    private final Random random = new SecureRandom();

    public List<GameSession> getAllSessions() {
        log.info("Fetching all game sessions");
        return repository.findAll();
    }

    public GameSession getSessionById(Long id) {
        log.info("Fetching session with id: {}", id);
        return repository.findById(id).orElse(null);
    }

    public GameSession createSession(GameSession session) {
        log.info("Creating new game session");
        session.setStartTime(LocalDateTime.now());
        session.setStatus(GameStatus.WAITING);
        session.setGamePin(generateGamePin());
        return repository.save(session);
    }

    private String generateGamePin() {
        return String.valueOf(random.nextInt(899999) + 100000);
    }

    public GameSession updateStatus(Long id, GameStatus status) {
        log.info("Updating status for session {}: {}", id, status);
        return repository.findById(id).map(session -> {
            session.setStatus(status);
            return repository.save(session);
        }).orElse(null);
    }

    public GameSession updateSession(Long id, GameSession sessionDetails) {
        log.info("Updating session with id: {}", id);
        return repository.findById(id).map(session -> {
            session.setStartTime(sessionDetails.getStartTime());
            session.setStatus(sessionDetails.getStatus());
            session.setGamePin(sessionDetails.getGamePin());
            session.setQuiz(sessionDetails.getQuiz());
            return repository.save(session);
        }).orElse(null);
    }

    public GameSession getSessionByPin(String pin) {
        log.info("Fetching session with pin: {}", pin);
        return repository.findByGamePin(pin).orElse(null);
    }

    public void deleteSession(Long id) {
        log.info("Deleting session with id: {}", id);
        repository.deleteById(id);
    }
}

