package com.example.quiz.service;

import com.example.quiz.entity.Score;
import com.example.quiz.repository.ScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScoreServiceTest {

    @Mock
    private ScoreRepository repository;

    @InjectMocks
    private ScoreService scoreService;

    private Score score;

    @BeforeEach
    void setUp() {
        score = new Score();
        score.setId(1L);
        score.setPoints(100);
        score.setUserId(201L);
    }

    @Test
    void testGetAllScores() {
        when(repository.findAll()).thenReturn(Arrays.asList(score));
        List<Score> scores = scoreService.getAllScores();
        assertNotNull(scores);
        assertEquals(1, scores.size());
    }

    @Test
    void testGetScoreById() {
        when(repository.findById(1L)).thenReturn(Optional.of(score));
        Score found = scoreService.getScoreById(1L);
        assertNotNull(found);
        assertEquals(100, found.getPoints());
    }

    @Test
    void testSaveScore() {
        when(repository.save(any(Score.class))).thenReturn(score);
        Score saved = scoreService.saveScore(new Score());
        assertNotNull(saved);
        assertEquals(100, saved.getPoints());
    }

    @Test
    void testUpdateScore() {
        Score updatedDetails = new Score();
        updatedDetails.setPoints(150);
        updatedDetails.setUserId(202L);

        when(repository.findById(1L)).thenReturn(Optional.of(score));
        when(repository.save(any(Score.class))).thenReturn(score);

        Score result = scoreService.updateScore(1L, updatedDetails);
        assertNotNull(result);
        assertEquals(150, result.getPoints());
    }

    @Test
    void testGetScoresBySessionId() {
        when(repository.findBySessionId(1L)).thenReturn(Arrays.asList(score));
        List<Score> scores = scoreService.getScoresBySessionId(1L);
        assertNotNull(scores);
        assertEquals(1, scores.size());
    }

    @Test
    void testDeleteScore() {
        doNothing().when(repository).deleteById(1L);
        scoreService.deleteScore(1L);
        verify(repository, times(1)).deleteById(1L);
    }
}
