package com.example.quiz.entity;

import jakarta.persistence.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private Long createdBy;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<QuizQuestion> questions;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<GameSession> sessions;

    public Quiz() {
        // Empty constructor for JPA
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public List<QuizQuestion> getQuestions() { return questions; }
    public void setQuestions(List<QuizQuestion> questions) { this.questions = questions; }

    public List<GameSession> getSessions() { return sessions; }
    public void setSessions(List<GameSession> sessions) { this.sessions = sessions; }
}
