package com.example.quiz.service;

import com.example.quiz.entity.Score;
import com.example.quiz.repository.ScoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScoreService {

    private final ScoreRepository repository;

    public List<Score> getAllScores() {
        log.info("Fetching all scores");
        return repository.findAll();
    }

    public Score getScoreById(Long id) {
        log.info("Fetching score with id: {}", id);
        return repository.findById(id).orElse(null);
    }

    public Score saveScore(Score score) {
        log.info("Saving new score for user: {}", score.getUserId());
        return repository.save(score);
    }

    public Score updateScore(Long id, Score scoreDetails) {
        log.info("Updating score with id: {}", id);
        return repository.findById(id).map(score -> {
            score.setPoints(scoreDetails.getPoints());
            score.setUserId(scoreDetails.getUserId());
            score.setSession(scoreDetails.getSession());
            return repository.save(score);
        }).orElse(null);
    }

    public void deleteScore(Long id) {
        log.info("Deleting score with id: {}", id);
        repository.deleteById(id);
    }

    public List<Score> getScoresBySessionId(Long sessionId) {
        log.info("Fetching scores for session id: {}", sessionId);
        return repository.findBySessionId(sessionId);
    }
}

