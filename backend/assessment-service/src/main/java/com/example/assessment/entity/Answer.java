package com.example.assessment.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "answer")  // CHANGEZ de "answers" à "answer"
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_correct")
    private boolean correct;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    private Question question;

    // Constructors
    public Answer() {}

    public Answer(String content, boolean correct, Question question) {
        this.content = content;
        this.correct = correct;
        this.question = question;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
}