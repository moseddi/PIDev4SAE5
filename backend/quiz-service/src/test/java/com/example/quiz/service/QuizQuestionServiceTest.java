package com.example.quiz.service;

import com.example.quiz.entity.QuizQuestion;
import com.example.quiz.repository.QuizQuestionRepository;
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
class QuizQuestionServiceTest {

    @Mock
    private QuizQuestionRepository repository;

    @InjectMocks
    private QuizQuestionService quizQuestionService;

    private QuizQuestion question;

    @BeforeEach
    void setUp() {
        question = new QuizQuestion();
        question.setId(1L);
        question.setContent("What is Java?");
        question.setTimeLimit(30);
        question.setOptions("[\"A programming language\", \"A coffee brand\"]");
    }

    @Test
    void testGetAllQuestions() {
        when(repository.findAll()).thenReturn(Arrays.asList(question));
        List<QuizQuestion> questions = quizQuestionService.getAllQuestions();
        assertNotNull(questions);
        assertEquals(1, questions.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void testGetQuestionById() {
        when(repository.findById(1L)).thenReturn(Optional.of(question));
        QuizQuestion found = quizQuestionService.getQuestionById(1L);
        assertNotNull(found);
        assertEquals("What is Java?", found.getContent());
    }

    @Test
    void testGetQuestionById_NotFound() {
        when(repository.findById(2L)).thenReturn(Optional.empty());
        QuizQuestion found = quizQuestionService.getQuestionById(2L);
        assertNull(found);
    }

    @Test
    void testSaveQuestion() {
        when(repository.save(any(QuizQuestion.class))).thenReturn(question);
        QuizQuestion saved = quizQuestionService.saveQuestion(new QuizQuestion());
        assertNotNull(saved);
        assertEquals("What is Java?", saved.getContent());
    }

    @Test
    void testUpdateQuestion_Success() {
        QuizQuestion updatedDetails = new QuizQuestion();
        updatedDetails.setContent("What is JVM?");
        updatedDetails.setTimeLimit(45);
        updatedDetails.setOptions("[\"Java Virtual Machine\", \"Java Version Manager\"]");

        when(repository.findById(1L)).thenReturn(Optional.of(question));
        when(repository.save(any(QuizQuestion.class))).thenReturn(question);

        QuizQuestion result = quizQuestionService.updateQuestion(1L, updatedDetails);

        assertNotNull(result);
        assertEquals("What is JVM?", result.getContent());
        assertEquals(45, result.getTimeLimit());
    }

    @Test
    void testUpdateQuestion_NotFound() {
        when(repository.findById(1L)).thenReturn(Optional.empty());
        QuizQuestion result = quizQuestionService.updateQuestion(1L, new QuizQuestion());
        assertNull(result);
    }

    @Test
    void testDeleteQuestion() {
        doNothing().when(repository).deleteById(1L);
        quizQuestionService.deleteQuestion(1L);
        verify(repository, times(1)).deleteById(1L);
    }
}
