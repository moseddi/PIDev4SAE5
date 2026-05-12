package com.example.assessment.service;

import com.example.assessment.entity.Attempt;
import com.example.assessment.repository.AttemptRepository;
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
public class AttemptServiceTest {

    @Mock
    private AttemptRepository repo;

    @InjectMocks
    private AttemptService attemptService;

    private Attempt attempt;

    @BeforeEach
    void setUp() {
        attempt = new Attempt();
        attempt.setId(1L);
        attempt.setScore(85);
    }

    @Test
    void testSave() {
        when(repo.save(any(Attempt.class))).thenReturn(attempt);
        Attempt result = attemptService.save(new Attempt());
        assertNotNull(result);
        assertEquals(85, result.getScore());
    }

    @Test
    void testUpdate_Success() {
        when(repo.existsById(1L)).thenReturn(true);
        when(repo.save(any(Attempt.class))).thenReturn(attempt);

        Attempt result = attemptService.update(attempt);
        assertNotNull(result);
    }

    @Test
    void testUpdate_Failure() {
        when(repo.existsById(1L)).thenReturn(false);
        assertThrows(IllegalArgumentException.class, () -> attemptService.update(attempt));
    }

    @Test
    void testDelete_Success() {
        when(repo.existsById(1L)).thenReturn(true);
        doNothing().when(repo).deleteById(1L);
        attemptService.delete(1L);
        verify(repo, times(1)).deleteById(1L);
    }

    @Test
    void testDelete_Failure() {
        when(repo.existsById(1L)).thenReturn(false);
        assertThrows(IllegalArgumentException.class, () -> attemptService.delete(1L));
    }

    @Test
    void testGetAll() {
        when(repo.findAll()).thenReturn(Arrays.asList(attempt));
        List<Attempt> results = attemptService.getAll();
        assertEquals(1, results.size());
    }

    @Test
    void testGetById_Success() {
        when(repo.findById(1L)).thenReturn(Optional.of(attempt));
        Attempt result = attemptService.getById(1L);
        assertNotNull(result);
    }

    @Test
    void testGetById_Failure() {
        when(repo.findById(1L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> attemptService.getById(1L));
    }
}
