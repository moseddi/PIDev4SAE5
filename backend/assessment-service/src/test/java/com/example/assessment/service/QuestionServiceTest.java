package com.example.assessment.service;

import com.example.assessment.entity.Question;
import com.example.assessment.entity.QuestionType;
import com.example.assessment.repository.QuestionRepository;
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
public class QuestionServiceTest {

    @Mock
    private QuestionRepository repository;

    @InjectMocks
    private QuestionService questionService;

    private Question question;

    @BeforeEach
    void setUp() {
        question = new Question();
        question.setId(1L);
        question.setContent("What is Java?");
        question.setType(QuestionType.MCQ);
    }

    @Test
    void testGetById() {
        when(repository.findById(1L)).thenReturn(Optional.of(question));
        Question result = questionService.getById(1L);
        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void testGetAll() {
        when(repository.findAll()).thenReturn(Arrays.asList(question));
        List<Question> results = questionService.getAll();
        assertEquals(1, results.size());
    }

    @Test
    void testSave() {
        when(repository.save(any(Question.class))).thenReturn(question);
        Question result = questionService.save(new Question());
        assertNotNull(result);
        assertEquals("What is Java?", result.getContent());
    }

    @Test
    void testUpdate_Success() {
        Question updateDetails = new Question();
        updateDetails.setId(1L);
        updateDetails.setContent("Updated Content");

        when(repository.findById(1L)).thenReturn(Optional.of(question));
        when(repository.save(any(Question.class))).thenReturn(question);

        Question result = questionService.update(updateDetails);
        assertNotNull(result);
        assertEquals("Updated Content", result.getContent());
    }

    @Test
    void testDelete() {
        doNothing().when(repository).deleteById(1L);
        questionService.delete(1L);
        verify(repository, times(1)).deleteById(1L);
    }

    @Test
    void testFindByExamId() {
        when(repository.findByExamId(1L)).thenReturn(Arrays.asList(question));
        List<Question> results = questionService.findByExamId(1L);
        assertEquals(1, results.size());
    }

    @Test
    void testGetByIdOrThrow_Success() {
        when(repository.findById(1L)).thenReturn(Optional.of(question));
        Question result = questionService.getByIdOrThrow(1L);
        assertNotNull(result);
    }

    @Test
    void testGetByIdOrThrow_Failure() {
        when(repository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> questionService.getByIdOrThrow(1L));
    }
}
