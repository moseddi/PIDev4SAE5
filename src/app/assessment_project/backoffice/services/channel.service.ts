import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Channel, ChannelPost, ChannelComment } from '../models/channel.models';

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private base = '/assessment-api/channels';
  
  private mockChannels: Channel[] = [];
  private mockPosts: ChannelPost[] = [];
  private readonly STORAGE_KEY = 'mock_channels';

  constructor(private http: HttpClient) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) this.mockChannels = JSON.parse(stored);
      const storedPosts = localStorage.getItem('mock_posts');
      if (storedPosts) this.mockPosts = JSON.parse(storedPosts);
    } catch {}
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.mockChannels));
      localStorage.setItem('mock_posts', JSON.stringify(this.mockPosts));
    } catch {}
  }

  // ── Channels ─────────────────────────────────────────────
  getAllChannels(userId?: number): Observable<Channel[]> {
    const url = userId ? `${this.base}?userId=${userId}` : this.base;
    return this.http.get<Channel[]>(url).pipe(
      tap(channels => {
        this.mockChannels = channels || [];
        this.saveToStorage();
      }),
      catchError(() => of(this.mockChannels))
    );
  }

  getChannelById(id: number, userId?: number): Observable<Channel> {
    const url = userId ? `${this.base}/${id}?userId=${userId}` : `${this.base}/${id}`;
    return this.http.get<Channel>(url).pipe(
      catchError(() => {
        const ch = this.mockChannels.find(c => Number(c.id) === Number(id));
        if (ch) return of(ch);
        throw new Error('Channel Not found');
      })
    );
  }

  createChannel(data: { name: string; description: string; createdBy: number }): Observable<Channel> {
    return this.http.post<Channel>(`${this.base}`, data).pipe(
      tap(ch => {
        this.mockChannels.unshift(ch);
        this.saveToStorage();
      }),
      catchError(() => {
        const newCh: Channel = {
          id: Math.max(...this.mockChannels.map(c => c.id || 0), 0) + 1,
          name: data.name,
          description: data.description,
          createdAt: new Date().toISOString(),
          membersCount: 1,
          postsCount: 0
        };
        this.mockChannels.unshift(newCh);
        this.saveToStorage();
        return of(newCh);
      })
    );
  }

  deleteChannel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => {
        this.mockChannels = this.mockChannels.filter(c => c.id !== id);
        this.saveToStorage();
      }),
      catchError(() => {
        this.mockChannels = this.mockChannels.filter(c => c.id !== id);
        this.saveToStorage();
        return of(void 0);
      })
    );
  }

  // ── Membership ────────────────────────────────────────────
  joinChannel(channelId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${channelId}/join?userId=${userId}`, {});
  }

  leaveChannel(channelId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${channelId}/leave?userId=${userId}`);
  }

  isMember(channelId: number, userId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.base}/${channelId}/is-member?userId=${userId}`);
  }

  // ── Posts ─────────────────────────────────────────────────
  getPostsByChannel(channelId: number, userId?: number): Observable<ChannelPost[]> {
    const url = userId ? `${this.base}/${channelId}/posts?userId=${userId}` : `${this.base}/${channelId}/posts`;
    return this.http.get<any[]>(url).pipe(
      map(posts => {
        if (!Array.isArray(posts)) return [];
        return posts.map(p => this.mapPost(p));
      }),
      tap(posts => {
        if (posts && posts.length > 0) {
          const others = this.mockPosts.filter(p => Number(p.channelId) !== Number(channelId));
          this.mockPosts = [...others, ...posts];
          this.saveToStorage();
        }
      }),
      catchError(() => of(this.mockPosts.filter(p => Number(p.channelId) === Number(channelId))))
    );
  }

  createPost(channelId: number, formData: FormData): Observable<ChannelPost> {
    return this.http.post<any>(`${this.base}/${channelId}/posts`, formData).pipe(
      map(p => this.mapPost(p)),
      tap(p => {
        this.mockPosts.unshift(p);
        this.saveToStorage();
      }),
      catchError(() => {
        const type = formData.get('postType') as any || 'TEXT';
        const newPost: ChannelPost = {
          id: Math.max(...this.mockPosts.map(p => p.id || 0), 0) + 1,
          channelId,
          authorId: Number(formData.get('authorId') || 1),
          postType: type,
          content: (formData.get('content') as string) || '',
          linkUrl: (formData.get('linkUrl') as string) || undefined,
          createdAt: new Date().toISOString(),
          likeCount: 0, commentCount: 0, shareCount: 0,
          likedByUser: false, sharedByUser: false, comments: [],
          type, likesCount: 0, commentsCount: 0, sharesCount: 0, liked: false
        };
        const file = formData.get('file') as File;
        if (file) newPost.fileName = file.name;
        this.mockPosts.unshift(newPost);
        this.saveToStorage();
        return of(newPost);
      })
    );
  }

  deletePost(channelId: number, postId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${channelId}/posts/${postId}`).pipe(
      tap(() => {
        this.mockPosts = this.mockPosts.filter(p => p.id !== postId);
        this.saveToStorage();
      }),
      catchError(() => {
        this.mockPosts = this.mockPosts.filter(p => p.id !== postId);
        this.saveToStorage();
        return of(void 0);
      })
    );
  }

  // ── Reactions ─────────────────────────────────────────────
  likePost(channelId: number, postId: number, userId: number): Observable<{ likesCount: number }> {
    return this.http.post<any>(`${this.base}/posts/${postId}/like?userId=${userId}`, {}).pipe(
      map(res => ({ likesCount: res?.likeCount ?? res?.likesCount ?? 0 }))
    );
  }

  sharePost(channelId: number, postId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/posts/${postId}/share?userId=${userId}`, {});
  }

  // ── Comments ──────────────────────────────────────────────
  addComment(channelId: number, postId: number, userId: number, content: string): Observable<ChannelComment> {
    return this.http.post<any>(`${this.base}/posts/${postId}/comments?userId=${userId}`, { content }).pipe(
      map(p => {
        const post = this.mapPost(p);
        return post.comments && post.comments.length > 0 
          ? post.comments[post.comments.length - 1] 
          : { id: 0, userId: userId, content: content, createdAt: new Date().toISOString(), authorName: 'Moi' };
      })
    );
  }

  /** Mappe les champs du backend (Java) vers ceux attendus par le Frontend (Angular) */
  private mapPost(p: any): ChannelPost {
    if (!p) return {} as ChannelPost;
    return {
      ...p,
      type: p.postType || p.type || 'TEXT',
      likesCount: p.likeCount !== undefined ? p.likeCount : (p.likesCount || 0),
      commentsCount: p.commentCount !== undefined ? p.commentCount : (p.commentsCount || 0),
      sharesCount: p.shareCount !== undefined ? p.shareCount : (p.sharesCount || 0),
      liked: p.likedByUser !== undefined ? p.likedByUser : (p.liked || false),
      comments: Array.isArray(p.comments) ? p.comments.map((c: any) => ({
        ...c,
        authorName: c.authorName || (c.userId ? `Utilisateur ${c.userId}` : 'Anonyme')
      })) : []
    };
  }
}
