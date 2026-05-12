package com.example.assessment.controller;

import com.example.assessment.entity.Attempt;
import com.example.assessment.repository.AnswerRepository;
import com.example.assessment.repository.ExamRepository;
import com.example.assessment.service.AttemptService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AttemptController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AttemptControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AttemptService service;

    @MockBean
    private ExamRepository examRepository;

    @MockBean
    private AnswerRepository answerRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Attempt attempt;

    @BeforeEach
    void setUp() {
        attempt = new Attempt();
        attempt.setId(1L);
        attempt.setScore(80);
    }

    @Test
    void testGetAll() throws Exception {
        when(service.getAll()).thenReturn(Arrays.asList(attempt));
        mockMvc.perform(get("/attempts"))
                .andExpect(status().isOk());
    }

    @Test
    void testCreate() throws Exception {
        when(service.save(any(Attempt.class))).thenReturn(attempt);
        mockMvc.perform(post("/attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(attempt)))
                .andExpect(status().isOk());
    }
}
