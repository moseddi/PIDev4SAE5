package com.example.assessment.service;

import com.example.assessment.entity.Exam;
import com.example.assessment.repository.ExamRepository;
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
public class ExamServiceTest {

    @Mock
    private ExamRepository repository;

    @InjectMocks
    private ExamService examService;

    private Exam exam;

    @BeforeEach
    void setUp() {
        exam = new Exam();
        exam.setId(1L);
        exam.setTitle("Spring Boot Test");
        exam.setDescription("Test description");
        exam.setDuration(60);
        exam.setExamType(Exam.ExamType.EXAM);
    }

    @Test
    void testGetAll() {
        when(repository.findAll()).thenReturn(Arrays.asList(exam));
        List<Exam> results = examService.getAll();
        assertNotNull(results);
        assertEquals(1, results.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void testGetById() {
        when(repository.findById(1L)).thenReturn(Optional.of(exam));
        Exam result = examService.getById(1L);
        assertNotNull(result);
        assertEquals("Spring Boot Test", result.getTitle());
    }

    @Test
    void testGetById_NotFound() {
        when(repository.findById(2L)).thenReturn(Optional.empty());
        Exam result = examService.getById(2L);
        assertNull(result);
    }

    @Test
    void testGetByIdOrThrow_Success() {
        when(repository.findById(1L)).thenReturn(Optional.of(exam));
        Exam result = examService.getByIdOrThrow(1L);
        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void testGetByIdOrThrow_Failure() {
        when(repository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> examService.getByIdOrThrow(1L));
    }

    @Test
    void testSave() {
        when(repository.save(any(Exam.class))).thenReturn(exam);
        Exam result = examService.save(new Exam());
        assertNotNull(result);
        assertEquals("Spring Boot Test", result.getTitle());
    }

    @Test
    void testUpdate_Success() {
        Exam updatedDetails = new Exam();
        updatedDetails.setTitle("Updated Title");
        updatedDetails.setDescription("Updated description");
        updatedDetails.setDuration(90);
        updatedDetails.setExamType(Exam.ExamType.QUIZ);

        when(repository.findById(1L)).thenReturn(Optional.of(exam));
        when(repository.save(any(Exam.class))).thenReturn(exam);

        Exam result = examService.update(1L, updatedDetails);

        assertNotNull(result);
        assertEquals("Updated Title", result.getTitle());
        assertEquals(90, result.getDuration());
        assertEquals(Exam.ExamType.QUIZ, result.getExamType());
    }

    @Test
    void testUpdateSafe_Success() {
        Exam updatedDetails = new Exam();
        updatedDetails.setTitle("Safe Update");
        
        when(repository.findById(1L)).thenReturn(Optional.of(exam));
        when(repository.save(any(Exam.class))).thenReturn(exam);

        Exam result = examService.updateSafe(1L, updatedDetails);

        assertNotNull(result);
        assertEquals("Safe Update", result.getTitle());
    }

    @Test
    void testDelete() {
        doNothing().when(repository).deleteById(1L);
        examService.delete(1L);
        verify(repository, times(1)).deleteById(1L);
    }
}
