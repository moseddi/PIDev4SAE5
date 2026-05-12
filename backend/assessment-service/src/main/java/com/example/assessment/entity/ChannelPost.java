package com.example.assessment.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "channel_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChannelPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "channel_id", nullable = false)
    private Long channelId;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(name = "post_type")
    private String postType; // TEXT, PDF, IMAGE, AUDIO, LINK

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "link_url")
    private String linkUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "like_count")
    private int likeCount;

    @Column(name = "comment_count")
    private int commentCount;

    @Column(name = "share_count")
    private int shareCount;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
