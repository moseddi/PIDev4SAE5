package com.example.career.service;

import com.example.career.entity.JobOffer;
import com.example.career.entity.Level;
import com.example.career.repository.JobOfferRepository;
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
public class JobOfferServiceTest {

    @Mock
    private JobOfferRepository repository;

    @InjectMocks
    private JobOfferService service;

    private JobOffer jobOffer;

    @BeforeEach
    void setUp() {
        jobOffer = new JobOffer();
        jobOffer.setId(1L);
        jobOffer.setTitle("Developer");
        jobOffer.setDescription("Java Dev");
        jobOffer.setRequiredLevel(Level.A1);
        jobOffer.setActive(true);
    }

    @Test
    void testGetAll() {
        when(repository.findAll()).thenReturn(Arrays.asList(jobOffer));
        List<JobOffer> result = service.getAllOffers();
        assertEquals(1, result.size());
        verify(repository).findAll();
    }

    @Test
    void testGetById_Found() {
        when(repository.findById(1L)).thenReturn(Optional.of(jobOffer));
        JobOffer result = service.getOfferById(1L);
        assertNotNull(result);
        assertEquals("Developer", result.getTitle());
    }

    @Test
    void testGetById_NotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        JobOffer result = service.getOfferById(99L);
        assertNull(result);
    }

    @Test
    void testSave() {
        when(repository.save(any(JobOffer.class))).thenReturn(jobOffer);
        JobOffer result = service.saveOffer(new JobOffer());
        assertNotNull(result);
        verify(repository).save(any());
    }

    @Test
    void testUpdate_Found() {
        JobOffer details = new JobOffer();
        details.setTitle("Senior Dev");
        details.setDescription("New Desc");
        details.setRequiredLevel(Level.C1);
        details.setActive(false);

        when(repository.findById(1L)).thenReturn(Optional.of(jobOffer));
        when(repository.save(any(JobOffer.class))).thenReturn(jobOffer);

        JobOffer result = service.updateOffer(1L, details);

        assertNotNull(result);
        assertEquals("Senior Dev", jobOffer.getTitle());
        assertEquals(Level.C1, jobOffer.getRequiredLevel());
        assertFalse(jobOffer.isActive());
    }

    @Test
    void testUpdate_NotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        JobOffer result = service.updateOffer(99L, new JobOffer());
        assertNull(result);
    }

    @Test
    void testDelete() {
        doNothing().when(repository).deleteById(1L);
        service.deleteOffer(1L);
        verify(repository, times(1)).deleteById(1L);
    }
}
