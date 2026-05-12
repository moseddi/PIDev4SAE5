package com.example.assessment.controller;

import com.example.assessment.entity.Channel;
import com.example.assessment.entity.ChannelPost;
import com.example.assessment.service.ChannelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    @GetMapping
    public ResponseEntity<List<Channel>> getAllChannels(@RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(channelService.getAllChannels(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Channel> getChannelById(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        return channelService.getChannelById(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Channel> createChannel(@RequestBody Channel channel) {
        return ResponseEntity.ok(channelService.createChannel(channel));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChannel(@PathVariable Long id) {
        channelService.deleteChannel(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Void> joinChannel(@PathVariable Long id, @RequestParam Long userId) {
        channelService.joinChannel(id, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<Void> leaveChannel(@PathVariable Long id, @RequestParam Long userId) {
        channelService.leaveChannel(id, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/is-member")
    public ResponseEntity<Boolean> isMember(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(channelService.isMember(id, userId));
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<List<ChannelPost>> getPostsByChannel(@PathVariable Long id) {
        return ResponseEntity.ok(channelService.getPostsByChannel(id));
    }

    @PostMapping("/{id}/posts")
    public ResponseEntity<ChannelPost> createPost(
            @PathVariable Long id,
            @RequestParam Long authorId,
            @RequestParam String postType,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) String linkUrl,
            @RequestParam(required = false) MultipartFile file) {
        
        ChannelPost post = ChannelPost.builder()
                .channelId(id)
                .authorId(authorId)
                .postType(postType)
                .content(content)
                .linkUrl(linkUrl)
                .build();
        
        if (file != null && !file.isEmpty()) {
            post.setFileName(file.getOriginalFilename());
            // In a real app, save file to disk/S3 and set fileUrl
            post.setFileUrl("/files/" + file.getOriginalFilename());
        }
        
        return ResponseEntity.ok(channelService.createPost(post));
    }
}
