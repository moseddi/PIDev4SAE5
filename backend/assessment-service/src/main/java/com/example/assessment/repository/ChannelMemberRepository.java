package com.example.assessment.repository;

import com.example.assessment.entity.ChannelMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelMemberRepository extends JpaRepository<ChannelMember, Long> {
    List<ChannelMember> findByUserId(Long userId);
    List<ChannelMember> findByChannelId(Long channelId);
    Optional<ChannelMember> findByChannelIdAndUserId(Long channelId, Long userId);
    boolean existsByChannelIdAndUserId(Long channelId, Long userId);
    void deleteByChannelIdAndUserId(Long channelId, Long userId);
}
