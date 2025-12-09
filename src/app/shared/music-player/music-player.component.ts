import { Component, inject, OnDestroy, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { YoutubePlayerService, UrlHistoryItem } from '../youtube-player.service';

@Component({
    selector: 'app-music-player',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './music-player.component.html',
    styleUrl: './music-player.component.css'
})
export class MusicPlayerComponent implements AfterViewInit, OnDestroy {
    youtubePlayer = inject(YoutubePlayerService);

    youtubeUrl = '';
    showUrlInput = signal(false);
    historyExpanded = signal(false);
    urlError = signal('');

    ngAfterViewInit(): void {
        // Initialize the YouTube player with the hidden container
        this.youtubePlayer.initPlayer('youtube-player-container');
    }

    ngOnDestroy(): void {
        this.youtubePlayer.destroy();
    }

    togglePlay(): void {
        this.youtubePlayer.togglePlay();
    }

    toggleUrlInput(): void {
        this.showUrlInput.update((v: boolean) => !v);
        this.urlError.set('');
    }

    toggleHistory(): void {
        this.historyExpanded.update((v: boolean) => !v);
    }

    loadCustomUrl(): void {
        if (!this.youtubeUrl.trim()) {
            this.urlError.set('Bitte URL eingeben');
            return;
        }

        const success = this.youtubePlayer.loadCustomVideo(this.youtubeUrl);

        if (success) {
            this.youtubeUrl = '';
            this.showUrlInput.set(false);
            this.urlError.set('');
        } else {
            this.urlError.set('Ungültige YouTube URL');
        }
    }

    loadFromHistory(item: UrlHistoryItem): void {
        this.youtubePlayer.loadFromHistory(item);
    }

    resetToDefault(): void {
        this.youtubePlayer.resetToDefault();
        this.youtubeUrl = '';
        this.showUrlInput.set(false);
        this.urlError.set('');
    }
}