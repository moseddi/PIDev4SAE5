package com.example.assessment.Dto;

import java.util.List;

public class SubmitExamPayload {
    private Long examId;
    private Long userId;
    private String studentName;
    private List<SubmitAnswerDto> answers;

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public List<SubmitAnswerDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<SubmitAnswerDto> answers) {
        this.answers = answers;
    }
}
