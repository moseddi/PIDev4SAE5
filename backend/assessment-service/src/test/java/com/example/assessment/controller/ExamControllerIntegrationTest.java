package com.example.assessment.controller;

import com.example.assessment.entity.Exam;
import com.example.assessment.service.ExamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExamControllerIntegrationTest {

    @Mock
    private ExamService service;

    @InjectMocks
    private ExamController examController;

    private Exam exam;

    @BeforeEach
    void setUp() {
        exam = new Exam();
        exam.setId(1L);
        exam.setTitle("Certified Java Developer");
    }

    @Test
    void testGetAllExams() {
        when(service.getAll()).thenReturn(Arrays.asList(exam));

        ResponseEntity<List<Exam>> response = examController.getAll();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Certified Java Developer", response.getBody().get(0).getTitle());
    }

    @Test
    void testGetExamById_Found() {
        when(service.getById(1L)).thenReturn(exam);

        ResponseEntity<Exam> response = examController.getById(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testGetExamById_NotFound() {
        when(service.getById(99L)).thenReturn(null);

        ResponseEntity<Exam> response = examController.getById(99L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void testCreateExam() {
        when(service.save(any(Exam.class))).thenReturn(exam);

        ResponseEntity<Exam> response = examController.create(exam);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testDeleteExam() {
        doNothing().when(service).delete(1L);

        ResponseEntity<Void> response = examController.delete(1L);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(service, times(1)).delete(1L);
    }
}
