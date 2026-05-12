package com.example.quiz.service;

import com.example.quiz.entity.GameSession;
import com.example.quiz.entity.GameStatus;
import com.example.quiz.repository.GameSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameSessionServiceTest {

    @Mock
    private GameSessionRepository repository;

    @InjectMocks
    private GameSessionService gameSessionService;

    private GameSession session;

    @BeforeEach
    void setUp() {
        session = new GameSession();
        session.setId(1L);
        session.setGamePin("123456");
        session.setStatus(GameStatus.WAITING);
        session.setStartTime(LocalDateTime.now());
    }

    @Test
    void testGetAllSessions() {
        when(repository.findAll()).thenReturn(Arrays.asList(session));
        List<GameSession> sessions = gameSessionService.getAllSessions();
        assertNotNull(sessions);
        assertEquals(1, sessions.size());
    }

    @Test
    void testGetSessionById() {
        when(repository.findById(1L)).thenReturn(Optional.of(session));
        GameSession found = gameSessionService.getSessionById(1L);
        assertNotNull(found);
        assertEquals("123456", found.getGamePin());
    }

    @Test
    void testCreateSession() {
        when(repository.save(any(GameSession.class))).thenReturn(session);
        GameSession created = gameSessionService.createSession(new GameSession());
        assertNotNull(created);
        assertNotNull(created.getGamePin());
        assertEquals(GameStatus.WAITING, created.getStatus());
    }

    @Test
    void testUpdateStatus() {
        when(repository.findById(1L)).thenReturn(Optional.of(session));
        when(repository.save(any(GameSession.class))).thenReturn(session);
        GameSession updated = gameSessionService.updateStatus(1L, GameStatus.EN_COURS);
        assertNotNull(updated);
        assertEquals(GameStatus.EN_COURS, updated.getStatus());
    }

    @Test
    void testGetSessionByPin() {
        when(repository.findByGamePin("123456")).thenReturn(Optional.of(session));
        GameSession found = gameSessionService.getSessionByPin("123456");
        assertNotNull(found);
        assertEquals(1L, found.getId());
    }

    @Test
    void testDeleteSession() {
        doNothing().when(repository).deleteById(1L);
        gameSessionService.deleteSession(1L);
        verify(repository, times(1)).deleteById(1L);
    }
}
