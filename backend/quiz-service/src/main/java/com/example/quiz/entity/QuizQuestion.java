package com.example.quiz.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@Entity
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;
    private int timeLimit;
    
    @Column(columnDefinition = "json")
    private String options;

    @ManyToOne
    @JoinColumn(name = "quiz_id")
    @JsonBackReference
    private Quiz quiz;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<QuizAnswer> answers;

    public QuizQuestion() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public int getTimeLimit() { return timeLimit; }
    public void setTimeLimit(int timeLimit) { this.timeLimit = timeLimit; }

    public Quiz getQuiz() { return quiz; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }

    /**
     * Allows Angular to send { "quizId": 1 } and have JPA set quiz_id correctly.
     * @JsonBackReference prevents the quiz field from being deserialized directly,
     * so we expose a flat setter instead.
     */
    @JsonProperty("quizId")
    public void setQuizId(Long quizId) {
        if (quizId != null) {
            Quiz q = new Quiz();
            q.setId(quizId);
            this.quiz = q;
        }
    }

    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }

    public List<QuizAnswer> getAnswers() { return answers; }
    public void setAnswers(List<QuizAnswer> answers) { this.answers = answers; }
}
