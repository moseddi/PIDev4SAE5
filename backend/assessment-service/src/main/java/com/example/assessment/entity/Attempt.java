package com.example.assessment.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Attempt")  // Doit correspondre au nom dans la base
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;          // l'id de l'utilisateur qui a passé l'exam
    private String studentName;   // nom de l'étudiant
    private int score;            // score obtenu
    private boolean passed;       // réussi ou non
    private LocalDateTime date = LocalDateTime.now(); // date de l'essai

    @ManyToOne
    @JoinColumn(name = "exam_id")
    private Exam exam;            // lien vers l'examen

    // ===========================
    // Constructeurs
    // ===========================
    public Attempt() {
    }

    public Attempt(Long userId, int score, LocalDateTime date, Exam exam) {
        this.userId = userId;
        this.score = score;
        this.date = date;
        this.exam = exam;
    }

    // ===========================
    // Getters et Setters
    // ===========================
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public boolean isPassed() {
        return passed;
    }

    public void setPassed(boolean passed) {
        this.passed = passed;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public Exam getExam() {
        return exam;
    }

    public void setExam(Exam exam) {
        this.exam = exam;
    }
}
