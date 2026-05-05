// ─── Channel Models ────────────────────────────────────────────────────────
export interface Channel {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  membersCount: number;
  postsCount: number;
  isMember?: boolean;
}

// ─── Channel Post (Publication) ───────────────────────────────────────────
export type PostType = 'TEXT' | 'PDF' | 'IMAGE' | 'AUDIO' | 'LINK';

export interface ChannelPost {
  id: number;
  channelId: number;
  authorId: number;
  postType: PostType;
  content: string;
  fileName?: string;
  fileUrl?: string;
  linkUrl?: string;
  createdAt: string;
  
  // Métriques (alignées sur le DTO Java)
  likeCount: number;      
  commentCount: number;   
  shareCount: number;     
  
  likedByUser?: boolean;  
  sharedByUser?: boolean; 
  
  comments: ChannelComment[]; 
  
  // UI ALIASES (Always populated by Service mapper)
  type: PostType;        
  likesCount: number;    
  commentsCount: number; 
  sharesCount: number;   
  liked: boolean;        
}

// ─── Comment ──────────────────────────────────────────────────────────────
export interface ChannelComment {
  id: number;
  userId: number;
  authorName?: string;
  content: string;
  createdAt: string;
}

// ─── WebSocket DTO (message reçu du serveur) ───────────────────────────────
export interface ChannelWsMessage {
  type: 'NEW_POST' | 'NEW_MEMBER' | 'LIKE_UPDATE';
  channelId: number;
  post?: ChannelPost;
  membersCount?: number;
  likesCount?: number;
  postId?: number;
}
