package com.example.quiz.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
public class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime startTime;

    @Enumerated(EnumType.STRING)
    private GameStatus status;

    private String gamePin;
    private int currentQuestionIndex = 0;

    @ManyToOne
    @JoinColumn(name = "quiz_id")
    @JsonBackReference
    private Quiz quiz;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Score> scores;

    public GameSession() {
        // Empty constructor for JPA
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public GameStatus getStatus() { return status; }
    public void setStatus(GameStatus status) { this.status = status; }

    public String getGamePin() { return gamePin; }
    public void setGamePin(String gamePin) { this.gamePin = gamePin; }

    public int getCurrentQuestionIndex() { return currentQuestionIndex; }
    public void setCurrentQuestionIndex(int index) { this.currentQuestionIndex = index; }

    public Quiz getQuiz() { return quiz; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }

    public List<Score> getScores() { return scores; }
    public void setScores(List<Score> scores) { this.scores = scores; }
}
