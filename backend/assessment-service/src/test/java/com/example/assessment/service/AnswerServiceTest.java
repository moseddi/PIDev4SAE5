package com.example.assessment.service;

import com.example.assessment.entity.Answer;
import com.example.assessment.repository.AnswerRepository;
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
public class AnswerServiceTest {

    @Mock
    private AnswerRepository repository;

    @InjectMocks
    private AnswerService answerService;

    private Answer answer;

    @BeforeEach
    void setUp() {
        answer = new Answer();
        answer.setId(1L);
        answer.setContent("Java is a programming language");
        answer.setCorrect(true);
    }

    @Test
    void testGetAll() {
        when(repository.findAll()).thenReturn(Arrays.asList(answer));
        List<Answer> results = answerService.getAll();
        assertEquals(1, results.size());
    }

    @Test
    void testGetById() {
        when(repository.findById(1L)).thenReturn(Optional.of(answer));
        Answer result = answerService.getById(1L);
        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void testSave() {
        when(repository.save(any(Answer.class))).thenReturn(answer);
        Answer result = answerService.save(new Answer());
        assertNotNull(result);
        assertTrue(result.isCorrect());
    }

    @Test
    void testUpdate_Success() {
        Answer updateDetails = new Answer();
        updateDetails.setId(1L);
        updateDetails.setContent("New Content");
        updateDetails.setCorrect(false);

        when(repository.findById(1L)).thenReturn(Optional.of(answer));
        when(repository.save(any(Answer.class))).thenReturn(answer);

        Answer result = answerService.update(updateDetails);
        assertNotNull(result);
        assertEquals("New Content", result.getContent());
        assertFalse(result.isCorrect());
    }

    @Test
    void testDelete() {
        doNothing().when(repository).deleteById(1L);
        answerService.delete(1L);
        verify(repository, times(1)).deleteById(1L);
    }

    @Test
    void testFindByQuestionId() {
        when(repository.findByQuestionId(1L)).thenReturn(Arrays.asList(answer));
        List<Answer> results = answerService.findByQuestionId(1L);
        assertEquals(1, results.size());
    }
}
