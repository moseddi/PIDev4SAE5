package com.example.assessment.controller;

import com.example.assessment.entity.Exam;
import com.example.assessment.service.ExamService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ExamController.class)
@AutoConfigureMockMvc(addFilters = false)
public class ExamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ExamService service;

    @Autowired
    private ObjectMapper objectMapper;

    private Exam exam;

    @BeforeEach
    void setUp() {
        exam = new Exam();
        exam.setId(1L);
        exam.setTitle("Test Exam");
    }

    @Test
    void testGetAll() throws Exception {
        when(service.getAll()).thenReturn(Arrays.asList(exam));

        mockMvc.perform(get("/exams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Test Exam"));
    }

    @Test
    void testGetById_Found() throws Exception {
        when(service.getById(1L)).thenReturn(exam);

        mockMvc.perform(get("/exams/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Exam"));
    }

    @Test
    void testGetById_NotFound() throws Exception {
        when(service.getById(1L)).thenReturn(null);

        mockMvc.perform(get("/exams/1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreate() throws Exception {
        when(service.save(any(Exam.class))).thenReturn(exam);

        mockMvc.perform(post("/exams")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(exam)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Exam"));
    }

    @Test
    void testUpdate_Success() throws Exception {
        when(service.updateSafe(eq(1L), any(Exam.class))).thenReturn(exam);

        mockMvc.perform(put("/exams/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(exam)))
                .andExpect(status().isOk());
    }

    @Test
    void testDelete_Success() throws Exception {
        doNothing().when(service).delete(1L);

        mockMvc.perform(delete("/exams/1"))
                .andExpect(status().isNoContent());
    }
}
