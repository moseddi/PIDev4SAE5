package com.example.quiz.repository;

import com.example.quiz.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    /** Fetch all questions for a quiz, eagerly loading answers to avoid LazyInitializationException */
    @Query("SELECT q FROM QuizQuestion q LEFT JOIN FETCH q.answers WHERE q.quiz.id = :quizId")
    List<QuizQuestion> findByQuizIdWithAnswers(@Param("quizId") Long quizId);
}
