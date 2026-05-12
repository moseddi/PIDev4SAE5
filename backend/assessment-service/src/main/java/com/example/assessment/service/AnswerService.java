package com.example.assessment.service;

import com.example.assessment.entity.Answer;
import com.example.assessment.repository.AnswerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AnswerService {

    @Autowired
    private AnswerRepository repository;
    
    @Autowired
    private com.example.assessment.repository.QuestionRepository questionRepository;

    public List<Answer> getAll() {
        return repository.findAll();
    }

    public Answer getById(Long id) {
        Optional<Answer> answer = repository.findById(id);
        return answer.orElse(null);
    }

    public Answer save(Answer answer) {
        if (answer.getQuestion() != null && answer.getQuestion().getId() != null) {
            com.example.assessment.entity.Question q = questionRepository.findById(answer.getQuestion().getId())
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));
            answer.setQuestion(q);
        }
        return repository.save(answer);
    }

    public Answer update(Answer answer) {
        Answer existingAnswer = getById(answer.getId());
        if (existingAnswer != null) {
            existingAnswer.setContent(answer.getContent());
            existingAnswer.setCorrect(answer.isCorrect());
            existingAnswer.setQuestion(answer.getQuestion());
            return repository.save(existingAnswer);
        }
        return null;
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<Answer> findByQuestionId(Long questionId) {
        return repository.findByQuestionId(questionId);
    }
}