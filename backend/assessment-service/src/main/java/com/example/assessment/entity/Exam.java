package com.example.assessment.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private Integer duration; // en minutes

    @Enumerated(EnumType.STRING)
    private ExamType examType; // ENUM: EXAM, QUIZ, TEST

    private Integer passingScore = 50; // Seuil de réussite par défaut à 50%

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Question> questions = new ArrayList<>();

    // Méthode helper pour gérer la relation bidirectionnelle
    public void addQuestion(Question question) {
        questions.add(question);
        question.setExam(this);
    }

    public void removeQuestion(Question question) {
        questions.remove(question);
        question.setExam(null);
    }

    // Constructeurs
    public Exam() {}

    public Exam(String title, String description, Integer duration, ExamType examType) {
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.examType = examType;
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public ExamType getExamType() { return examType; }
    public void setExamType(ExamType examType) { this.examType = examType; }

    public Integer getPassingScore() { return passingScore; }
    public void setPassingScore(Integer passingScore) { this.passingScore = passingScore; }

    // IMPORTANT : Ne pas remplacer la collection, mais la modifier
    public List<Question> getQuestions() {
        if (questions == null) {
            questions = new ArrayList<>();
        }
        return questions;
    }

    public void setQuestions(List<Question> questions) {
        if (this.questions == null) {
            this.questions = questions;
        } else {
            // Ne pas remplacer la collection, mais la vider et ajouter les nouveaux éléments
            this.questions.clear();
            if (questions != null) {
                this.questions.addAll(questions);
                // Mettre à jour la relation inverse
                for (Question question : questions) {
                    question.setExam(this);
                }
            }
        }
    }

    // Enum
    public enum ExamType {
        EXAM, QUIZ, TEST
    }
}