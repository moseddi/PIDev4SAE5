package com.example.career.controller;

import com.example.career.entity.Application;
import com.example.career.service.ApplicationService;
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

@WebMvcTest(ApplicationController.class)
@AutoConfigureMockMvc(addFilters = false)
public class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationService service;

    @Autowired
    private ObjectMapper objectMapper;

    private Application application;

    @BeforeEach
    void setUp() {
        application = new Application();
        application.setId(1L);
        application.setUserId(100L);
    }

    @Test
    void testGetAll() throws Exception {
        when(service.getAllApplications()).thenReturn(Arrays.asList(application));
        mockMvc.perform(get("/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(100L));
    }

    @Test
    void testGetById() throws Exception {
        when(service.getApplicationById(1L)).thenReturn(application);
        mockMvc.perform(get("/applications/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(100L));
    }

    @Test
    void testCreate() throws Exception {
        when(service.saveApplication(any(Application.class), any())).thenReturn(application);
        mockMvc.perform(post("/applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(application)))
                .andExpect(status().isOk());
    }
}
