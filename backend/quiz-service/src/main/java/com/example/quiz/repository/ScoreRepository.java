package com.example.quiz.repository;

import com.example.quiz.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    List<Score> findBySessionId(Long sessionId);
    boolean existsBySessionIdAndUsernameAndQuestionIndex(Long sessionId, String username, int questionIndex);
}
