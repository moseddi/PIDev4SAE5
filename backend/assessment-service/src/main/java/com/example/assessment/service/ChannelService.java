package com.example.assessment.service;

import com.example.assessment.entity.Channel;
import com.example.assessment.entity.ChannelMember;
import com.example.assessment.entity.ChannelPost;
import com.example.assessment.repository.ChannelMemberRepository;
import com.example.assessment.repository.ChannelPostRepository;
import com.example.assessment.repository.ChannelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final ChannelMemberRepository memberRepository;
    private final ChannelPostRepository postRepository;

    public List<Channel> getAllChannels(Long userId) {
        List<Channel> channels = channelRepository.findAll();
        if (userId != null) {
            channels.forEach(ch -> {
                ch.setIsMember(memberRepository.existsByChannelIdAndUserId(ch.getId(), userId));
                ch.setMembersCount(memberRepository.findByChannelId(ch.getId()).size());
                ch.setPostsCount(postRepository.findByChannelIdOrderByCreatedAtDesc(ch.getId()).size());
            });
        } else {
            channels.forEach(ch -> {
                ch.setIsMember(false);
                ch.setMembersCount(memberRepository.findByChannelId(ch.getId()).size());
                ch.setPostsCount(postRepository.findByChannelIdOrderByCreatedAtDesc(ch.getId()).size());
            });
        }
        return channels;
    }

    public Optional<Channel> getChannelById(Long id, Long userId) {
        return channelRepository.findById(id).map(ch -> {
            if (userId != null) {
                ch.setIsMember(memberRepository.existsByChannelIdAndUserId(ch.getId(), userId));
            } else {
                ch.setIsMember(false);
            }
            ch.setMembersCount(memberRepository.findByChannelId(ch.getId()).size());
            ch.setPostsCount(postRepository.findByChannelIdOrderByCreatedAtDesc(ch.getId()).size());
            return ch;
        });
    }

    public Channel createChannel(Channel channel) {
        Channel saved = channelRepository.save(channel);
        // Automatically join creator
        joinChannel(saved.getId(), channel.getCreatedBy());
        return saved;
    }

    @Transactional
    public void deleteChannel(Long id) {
        channelRepository.deleteById(id);
        // Cleanup members and posts? (Hibernate @OnDelete or manual)
    }

    public void joinChannel(Long channelId, Long userId) {
        if (!memberRepository.existsByChannelIdAndUserId(channelId, userId)) {
            memberRepository.save(ChannelMember.builder()
                    .channelId(channelId)
                    .userId(userId)
                    .build());
        }
    }

    @Transactional
    public void leaveChannel(Long channelId, Long userId) {
        memberRepository.deleteByChannelIdAndUserId(channelId, userId);
    }

    public boolean isMember(Long channelId, Long userId) {
        return memberRepository.existsByChannelIdAndUserId(channelId, userId);
    }

    public List<ChannelPost> getPostsByChannel(Long channelId) {
        return postRepository.findByChannelIdOrderByCreatedAtDesc(channelId);
    }

    public ChannelPost createPost(ChannelPost post) {
        return postRepository.save(post);
    }
}
