package com.example.assessment.controller;

import com.example.assessment.entity.Question;
import com.example.assessment.service.QuestionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(QuestionController.class)
@AutoConfigureMockMvc(addFilters = false)
public class QuestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private QuestionService service;

    @Autowired
    private ObjectMapper objectMapper;

    private Question question;

    @BeforeEach
    void setUp() {
        question = new Question();
        question.setId(1L);
        question.setContent("Test Question");
    }

    @Test
    void testGetAll() throws Exception {
        when(service.getAll()).thenReturn(Arrays.asList(question));
        mockMvc.perform(get("/api/questions"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetById() throws Exception {
        when(service.getById(1L)).thenReturn(question);
        mockMvc.perform(get("/api/questions/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testCreate() throws Exception {
        when(service.save(any(Question.class))).thenReturn(question);
        mockMvc.perform(post("/api/questions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(question)))
                .andExpect(status().isOk());
    }
}
