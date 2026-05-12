package com.example.assessment.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "quiz-service")
public interface QuizClient {

    @GetMapping("/api/quizzes/by-exam/{examId}")
    List<Object> getQuizzesByExamId(@PathVariable("examId") Long examId);
}
