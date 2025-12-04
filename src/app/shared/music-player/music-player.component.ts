import { Component, inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YoutubePlayerService } from '../youtube-player.service';

@Component({
    selector: 'app-music-player',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './music-player.component.html',
    styleUrl: './music-player.component.css'
})
export class MusicPlayerComponent implements AfterViewInit, OnDestroy {
    youtubePlayer = inject(YoutubePlayerService);

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
}