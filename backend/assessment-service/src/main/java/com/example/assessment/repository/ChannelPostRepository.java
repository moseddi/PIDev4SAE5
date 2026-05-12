package com.example.assessment.repository;

import com.example.assessment.entity.ChannelPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChannelPostRepository extends JpaRepository<ChannelPost, Long> {
    List<ChannelPost> findByChannelIdOrderByCreatedAtDesc(Long channelId);
}
