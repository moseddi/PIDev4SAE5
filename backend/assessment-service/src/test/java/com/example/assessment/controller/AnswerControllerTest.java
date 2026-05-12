package com.example.assessment.controller;

import com.example.assessment.entity.Answer;
import com.example.assessment.service.AnswerService;
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

@WebMvcTest(AnswerController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AnswerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnswerService service;

    @Autowired
    private ObjectMapper objectMapper;

    private Answer answer;

    @BeforeEach
    void setUp() {
        answer = new Answer();
        answer.setId(1L);
        answer.setContent("Test Answer");
    }

    @Test
    void testGetAll() throws Exception {
        when(service.getAll()).thenReturn(Arrays.asList(answer));
        mockMvc.perform(get("/answers"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetById() throws Exception {
        when(service.getById(1L)).thenReturn(answer);
        mockMvc.perform(get("/answers/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testCreate() throws Exception {
        when(service.save(any(Answer.class))).thenReturn(answer);
        mockMvc.perform(post("/answers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(answer)))
                .andExpect(status().isOk());
    }
}
