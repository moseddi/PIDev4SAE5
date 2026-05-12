package com.example.career.service;

import com.example.career.entity.Application;
import com.example.career.entity.ApplicationStatus;
import com.example.career.entity.JobOffer;
import com.example.career.repository.ApplicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ApplicationServiceTest {

    @Mock
    private ApplicationRepository repository;

    @InjectMocks
    private ApplicationService service;

    private Application application;

    @BeforeEach
    void setUp() {
        application = new Application();
        application.setId(1L);
        application.setUserId(100L);
        application.setStatus(ApplicationStatus.PENDING);
    }

    @Test
    void testGetAll() {
        when(repository.findAll()).thenReturn(Arrays.asList(application));
        List<Application> result = service.getAllApplications();
        assertEquals(1, result.size());
        verify(repository).findAll();
    }

    @Test
    void testGetById_Found() {
        when(repository.findById(1L)).thenReturn(Optional.of(application));
        Application result = service.getApplicationById(1L);
        assertNotNull(result);
        assertEquals(100L, result.getUserId());
    }

    @Test
    void testGetById_NotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        Application result = service.getApplicationById(99L);
        assertNull(result);
    }

    @Test
    void testSave() {
        when(repository.save(any(Application.class))).thenReturn(application);
        Application result = service.saveApplication(new Application());
        assertNotNull(result);
        verify(repository).save(any());
    }

    @Test
    void testUpdate_Found() {
        Application details = new Application();
        details.setStatus(ApplicationStatus.ACCEPTED);
        details.setUserId(200L);
        
        when(repository.findById(1L)).thenReturn(Optional.of(application));
        when(repository.save(any(Application.class))).thenReturn(application);
        
        Application result = service.updateApplication(1L, details);
        
        assertNotNull(result);
        assertEquals(ApplicationStatus.ACCEPTED, application.getStatus());
        assertEquals(200L, application.getUserId());
    }

    @Test
    void testUpdate_NotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        Application result = service.updateApplication(99L, new Application());
        assertNull(result);
    }

    @Test
    void testDelete() {
        doNothing().when(repository).deleteById(1L);
        service.deleteApplication(1L);
        verify(repository, times(1)).deleteById(1L);
    }
}
