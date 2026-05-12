package com.example.quiz.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
public class QuizAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;

    @JsonProperty("isCorrect")
    private boolean isCorrect;

    @ManyToOne
    @JoinColumn(name = "question_id")
    @JsonBackReference
    private QuizQuestion question;

    public QuizAnswer() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public boolean isCorrect() { return isCorrect; }
    public void setCorrect(boolean correct) { isCorrect = correct; }

    public QuizQuestion getQuestion() { return question; }
    public void setQuestion(QuizQuestion question) { this.question = question; }

    /**
     * Allows Angular to send { "questionId": 5 } and have JPA set question_id correctly.
     * @JsonBackReference prevents the question field from being deserialized directly.
     */
    @JsonProperty("questionId")
    public void setQuestionId(Long questionId) {
        if (questionId != null) {
            QuizQuestion q = new QuizQuestion();
            q.setId(questionId);
            this.question = q;
        }
    }
}
