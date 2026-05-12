package com.example.career.repository;

import com.example.career.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByJobOfferId(Long jobOfferId);
    List<Application> findByUserId(Long userId);
}
