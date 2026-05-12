package com.example.assessment.controller;

import com.example.assessment.entity.Question;
import com.example.assessment.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    // GET all questions
    @GetMapping
    public List<Question> getAll() {
        return questionService.getAll();
    }

    // GET question by ID
    @GetMapping("/{id}")
    public Question getById(@PathVariable Long id) {
        return questionService.getById(id);
    }

    // POST create new question
    @PostMapping
    public Question create(@RequestBody Question question) {
        return questionService.save(question);
    }

    // PUT update question
    @PutMapping("/{id}")
    public Question update(@PathVariable Long id, @RequestBody Question question) {
        question.setId(id);
        return questionService.update(question);
    }

    // DELETE question
    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        questionService.delete(id);
        return "Question deleted successfully";
    }

    // GET questions by exam ID
    @GetMapping("/exam/{examId}")
    public List<Question> getByExamId(@PathVariable Long examId) {
        return questionService.findByExamId(examId);
    }
}