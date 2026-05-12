package com.example.assessment.controller;

import com.example.assessment.entity.Answer;
import com.example.assessment.service.AnswerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/answers")
public class AnswerController {

    @Autowired
    private AnswerService service;

    @GetMapping
    public List<Answer> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Answer> getById(@PathVariable Long id) {
        Answer answer = service.getById(id);
        if (answer == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(answer);
    }

    @PostMapping
    public Answer create(@RequestBody Answer answer) {
        return service.save(answer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Answer> update(@PathVariable Long id, @RequestBody Answer answer) {
        answer.setId(id);
        Answer updatedAnswer = service.update(answer);
        if (updatedAnswer == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedAnswer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/question/{questionId}")
    public List<Answer> getByQuestionId(@PathVariable Long questionId) {
        return service.findByQuestionId(questionId);
    }
}