import { Injectable, signal } from '@angular/core';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

@Injectable({
    providedIn: 'root'
})
export class YoutubePlayerService {
    private player: any = null;
    private apiReady = false;
    private apiLoadPromise: Promise<void> | null = null;

    // Default lofi hip hop stream - popular 24/7 stream
    private readonly defaultStreamId = 'jfKfPfyJRdk'; // lofi girl
    private readonly streamTitle = 'lofi hip hop radio 📚 beats to relax/study to';

    isPlaying = signal(false);
    currentTitle = signal(this.streamTitle);
    isLoading = signal(false);

    constructor() {
        this.loadYouTubeAPI();
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
                break;
            case 2: // PAUSED
                this.isPlaying.set(false);
                this.isLoading.set(false);
                break;
            case 3: // BUFFERING
                this.isLoading.set(true);
                break;
            case 0: // ENDED
            case -1: // UNSTARTED
                this.isPlaying.set(false);
                this.isLoading.set(false);
                break;
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
}