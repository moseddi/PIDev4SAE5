package com.example.quiz.service;

import com.example.quiz.entity.Quiz;
import com.example.quiz.repository.QuizRepository;
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
class QuizServiceTest {

    @Mock
    private QuizRepository repository;

    @InjectMocks
    private QuizService quizService;

    private Quiz quiz;

    @BeforeEach
    void setUp() {
        quiz = new Quiz();
        quiz.setId(1L);
        quiz.setTitle("Java Basics");
        quiz.setDescription("Basic Java questions");
        quiz.setCreatedBy(101L);
    }

    @Test
    void testGetAllQuizzes() {
        when(repository.findAll()).thenReturn(Arrays.asList(quiz));
        List<Quiz> quizzes = quizService.getAllQuizzes();
        assertNotNull(quizzes);
        assertEquals(1, quizzes.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void testGetQuizById() {
        when(repository.findById(1L)).thenReturn(Optional.of(quiz));
        Quiz found = quizService.getQuizById(1L);
        assertNotNull(found);
        assertEquals("Java Basics", found.getTitle());
    }

    @Test
    void testGetQuizById_NotFound() {
        when(repository.findById(2L)).thenReturn(Optional.empty());
        Quiz found = quizService.getQuizById(2L);
        assertNull(found);
    }

    @Test
    void testSaveQuiz() {
        when(repository.save(any(Quiz.class))).thenReturn(quiz);
        Quiz saved = quizService.saveQuiz(new Quiz());
        assertNotNull(saved);
        assertEquals("Java Basics", saved.getTitle());
    }

    @Test
    void testUpdateQuiz_Success() {
        Quiz updatedDetails = new Quiz();
        updatedDetails.setTitle("Advanced Java");
        updatedDetails.setDescription("Updated description");
        updatedDetails.setCreatedBy(102L);

        when(repository.findById(1L)).thenReturn(Optional.of(quiz));
        when(repository.save(any(Quiz.class))).thenReturn(quiz);

        Quiz result = quizService.updateQuiz(1L, updatedDetails);

        assertNotNull(result);
        assertEquals("Advanced Java", result.getTitle());
        assertEquals("Updated description", result.getDescription());
        assertEquals(102L, result.getCreatedBy());
    }

    @Test
    void testUpdateQuiz_NotFound() {
        when(repository.findById(1L)).thenReturn(Optional.empty());
        Quiz result = quizService.updateQuiz(1L, new Quiz());
        assertNull(result);
    }

    @Test
    void testDeleteQuiz() {
        doNothing().when(repository).deleteById(1L);
        quizService.deleteQuiz(1L);
        verify(repository, times(1)).deleteById(1L);
    }
}
