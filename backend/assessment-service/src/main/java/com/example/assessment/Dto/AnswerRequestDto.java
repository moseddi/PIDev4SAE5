package com.example.assessment.dto;

public class AnswerRequestDto {
    private String content;
    private boolean correct;
    private Long questionId;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
}