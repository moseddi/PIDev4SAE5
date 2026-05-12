package com.example.quiz.controller;

import com.example.quiz.entity.Quiz;
import com.example.quiz.service.QuizService;
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
class QuizControllerIntegrationTest {

    @Mock
    private QuizService service;

    @InjectMocks
    private QuizController quizController;

    private Quiz quiz;

    @BeforeEach
    void setUp() {
        quiz = new Quiz();
        quiz.setId(1L);
        quiz.setTitle("General Knowledge");
    }

    @Test
    void testGetAllQuizzes() {
        when(service.getAllQuizzes()).thenReturn(Arrays.asList(quiz));

        ResponseEntity<List<Quiz>> response = quizController.getAll();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("General Knowledge", response.getBody().get(0).getTitle());
    }

    @Test
    void testGetQuizById_Found() {
        when(service.getQuizById(1L)).thenReturn(quiz);

        ResponseEntity<Quiz> response = quizController.getById(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("General Knowledge", response.getBody().getTitle());
    }

    @Test
    void testGetQuizById_NotFound() {
        when(service.getQuizById(99L)).thenReturn(null);

        ResponseEntity<Quiz> response = quizController.getById(99L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void testCreateQuiz() {
        when(service.saveQuiz(any(Quiz.class))).thenReturn(quiz);

        ResponseEntity<Quiz> response = quizController.create(quiz);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testDeleteQuiz() {
        doNothing().when(service).deleteQuiz(1L);

        ResponseEntity<Void> response = quizController.delete(1L);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(service, times(1)).deleteQuiz(1L);
    }
}
