import { Injectable, signal, computed } from '@angular/core';
import { STORAGE_KEYS } from '../core/storage-keys.const';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

export interface UrlHistoryItem {
    videoId: string;
    title: string;
    url: string;
    timestamp: number;
}

@Injectable({
    providedIn: 'root'
})
export class YoutubePlayerService {
    private player: any = null;
    private apiReady = false;
    private apiLoadPromise: Promise<void> | null = null;
    private loopEnabled = true;
    private readonly MAX_HISTORY_ITEMS = 5;
    private pendingVideoId: string | null = null;
    private pendingUrl: string | null = null;

    // Default lofi hip hop stream - popular 24/7 stream
    private readonly defaultStreamId = 'jfKfPfyJRdk'; // lofi girl
    private readonly defaultTitle = 'lofi hip hop radio 📚 beats to relax/study to';
    private currentVideoId = this.defaultStreamId;

    isPlaying = signal(false);
    currentTitle = signal(this.defaultTitle);
    isLoading = signal(false);
    isCustomVideo = signal(false);
    urlHistory = signal<UrlHistoryItem[]>([]);

    constructor() {
        this.loadYouTubeAPI();
        this.loadHistoryFromStorage();
    }

    private loadHistoryFromStorage(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.YOUTUBE);
            if (stored) {
                const history = JSON.parse(stored) as UrlHistoryItem[];
                this.urlHistory.set(history);
            }
        } catch (e) {
            console.error('Error loading URL history:', e);
        }
    }

    private saveHistoryToStorage(): void {
        try {
            localStorage.setItem(STORAGE_KEYS.YOUTUBE, JSON.stringify(this.urlHistory()));
        } catch (e) {
            console.error('Error saving URL history:', e);
        }
    }

    private addToHistory(videoId: string, title: string, url: string): void {
        const currentHistory = this.urlHistory();

        // Remove existing entry with same videoId if present
        const filteredHistory = currentHistory.filter(item => item.videoId !== videoId);

        // Add new item at the beginning
        const newItem: UrlHistoryItem = {
            videoId,
            title,
            url,
            timestamp: Date.now()
        };

        // Keep only last 5 items
        const newHistory = [newItem, ...filteredHistory].slice(0, this.MAX_HISTORY_ITEMS);
        this.urlHistory.set(newHistory);
        this.saveHistoryToStorage();
    }

    updateHistoryTitle(videoId: string, title: string): void {
        const currentHistory = this.urlHistory();
        const updatedHistory = currentHistory.map(item =>
            item.videoId === videoId ? { ...item, title } : item
        );
        this.urlHistory.set(updatedHistory);
        this.saveHistoryToStorage();
    }

    private loadYouTubeAPI(): Promise<void> {
        if (this.apiLoadPromise) {
            return this.apiLoadPromise;
        }

        this.apiLoadPromise = new Promise((resolve) => {
            if (window.YT && window.YT.Player) {
                this.apiReady = true;
                resolve();
                return;
            }

            // Load the YouTube IFrame API
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                this.apiReady = true;
                resolve();
            };
        });

        return this.apiLoadPromise;
    }

    async initPlayer(containerId: string): Promise<void> {
        await this.loadYouTubeAPI();

        if (this.player) {
            return;
        }

        return new Promise((resolve) => {
            this.player = new window.YT.Player(containerId, {
                height: '0',
                width: '0',
                videoId: this.defaultStreamId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0
                },
                events: {
                    onReady: () => {
                        this.isLoading.set(false);
                        resolve();
                    },
                    onStateChange: (event: any) => {
                        this.handleStateChange(event);
                    },
                    onError: (event: any) => {
                        console.error('YouTube Player Error:', event.data);
                        this.isPlaying.set(false);
                        this.isLoading.set(false);
                    }
                }
            });
        });
    }

    private handleStateChange(event: any): void {
        // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
        switch (event.data) {
            case 1: // PLAYING
                this.isPlaying.set(true);
                this.isLoading.set(false);
                // Fetch title when video starts playing (most reliable time)
                this.fetchAndUpdateTitle();
                break;
            case 2: // PAUSED
                this.isPlaying.set(false);
                this.isLoading.set(false);
                break;
            case 3: // BUFFERING
                this.isLoading.set(true);
                break;
            case 0: // ENDED - restart if loop is enabled
                if (this.loopEnabled && this.player) {
                    this.player.seekTo(0);
                    this.player.playVideo();
                } else {
                    this.isPlaying.set(false);
                    this.isLoading.set(false);
                }
                break;
            case -1: // UNSTARTED
                this.isPlaying.set(false);
                this.isLoading.set(false);
                break;
        }
    }

    private fetchAndUpdateTitle(): void {
        if (!this.player || !this.player.getVideoData) return;

        const videoData = this.player.getVideoData();
        if (videoData && videoData.title) {
            this.currentTitle.set(videoData.title);

            // Update history with real title if this was a pending video
            if (this.pendingVideoId && this.pendingUrl) {
                this.addToHistory(this.pendingVideoId, videoData.title, this.pendingUrl);
                this.pendingVideoId = null;
                this.pendingUrl = null;
            }
        }
    }

    togglePlay(): void {
        if (!this.player) {
            return;
        }

        if (this.isPlaying()) {
            this.player.pauseVideo();
        } else {
            this.isLoading.set(true);
            this.player.playVideo();
        }
    }

    play(): void {
        if (this.player && !this.isPlaying()) {
            this.isLoading.set(true);
            this.player.playVideo();
        }
    }

    pause(): void {
        if (this.player && this.isPlaying()) {
            this.player.pauseVideo();
        }
    }

    destroy(): void {
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
    }

    /**
     * Extract video ID from various YouTube URL formats
     */
    extractVideoId(url: string): string | null {
        if (!url) return null;

        // Handle various YouTube URL formats
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Load a custom YouTube video/stream by URL
     */
    loadCustomVideo(url: string): boolean {
        const videoId = this.extractVideoId(url);

        if (!videoId) {
            return false;
        }

        if (!this.player) {
            return false;
        }

        this.currentVideoId = videoId;
        this.isCustomVideo.set(true);
        this.isLoading.set(true);
        this.currentTitle.set('Lädt...');

        // Store pending info for history update when title is fetched
        this.pendingVideoId = videoId;
        this.pendingUrl = url;

        // Load the new video
        this.player.loadVideoById(videoId);

        return true;
    }

    /**
     * Load a video from history
     */
    loadFromHistory(item: UrlHistoryItem): void {
        if (!this.player) return;

        this.currentVideoId = item.videoId;
        this.isCustomVideo.set(true);
        this.isLoading.set(true);
        this.currentTitle.set(item.title);

        // Move to top of history
        this.addToHistory(item.videoId, item.title, item.url);

        // Load the video
        this.player.loadVideoById(item.videoId);
    }

    /**
     * Clear URL history
     */
    clearHistory(): void {
        this.urlHistory.set([]);
        this.saveHistoryToStorage();
    }



    /**
     * Reset to the default lofi stream
     */
    resetToDefault(): void {
        if (!this.player) return;

        this.currentVideoId = this.defaultStreamId;
        this.isCustomVideo.set(false);
        this.currentTitle.set(this.defaultTitle);
        this.isLoading.set(true);
        this.player.loadVideoById(this.defaultStreamId);
    }

    /**
     * Get current video ID
     */
    getCurrentVideoId(): string {
        return this.currentVideoId;
    }
}