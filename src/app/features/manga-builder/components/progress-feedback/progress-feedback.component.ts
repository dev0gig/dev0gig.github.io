import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressState } from '../../services/file-processor.service';

@Component({
    selector: 'app-progress-feedback',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './progress-feedback.component.html',
    styleUrl: './progress-feedback.component.css'
})
export class ProgressFeedbackComponent {
    @Input() progress: ProgressState = {
        status: 'idle',
        message: '',
        progress: 0
    };

    get isActive(): boolean {
        return this.progress.status !== 'idle' && this.progress.status !== 'complete';
    }

    get isComplete(): boolean {
        return this.progress.status === 'complete';
    }

    get isError(): boolean {
        return this.progress.status === 'error';
    }

    get statusIcon(): string {
        switch (this.progress.status) {
            case 'extracting': return 'folder_open';
            case 'processing': return 'settings';
            case 'compressing': return 'compress';
            case 'complete': return 'check_circle';
            case 'error': return 'error';
            default: return 'hourglass_empty';
        }
    }
}
