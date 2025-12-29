import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, output } from '@angular/core';

@Component({
    selector: 'app-drawing-canvas',
    standalone: true,
    templateUrl: './drawing-canvas.component.html'
})
export class DrawingCanvasComponent implements AfterViewInit, OnDestroy {
    @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

    cleared = output<void>();

    private ctx: CanvasRenderingContext2D | null = null;
    private isDrawing = false;
    private lastX = 0;
    private lastY = 0;

    private boundTouchStart = this.handleTouchStart.bind(this);
    private boundTouchMove = this.handleTouchMove.bind(this);
    private boundTouchEnd = this.handleTouchEnd.bind(this);

    ngAfterViewInit(): void {
        this.initCanvas();
    }

    ngOnDestroy(): void {
        this.removeCanvasListeners();
    }

    private initCanvas(): void {
        if (!this.canvasRef?.nativeElement) return;
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d');

        if (this.ctx) {
            this.ctx.strokeStyle = '#e4e4e7';
            this.ctx.lineWidth = 5;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        }

        canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    }

    private removeCanvasListeners(): void {
        if (!this.canvasRef?.nativeElement) return;
        const canvas = this.canvasRef.nativeElement;
        canvas.removeEventListener('touchstart', this.boundTouchStart);
        canvas.removeEventListener('touchmove', this.boundTouchMove);
        canvas.removeEventListener('touchend', this.boundTouchEnd);
    }

    // Mouse events
    onMouseDown(event: MouseEvent): void {
        this.isDrawing = true;
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        this.lastX = (event.clientX - rect.left) * scaleX;
        this.lastY = (event.clientY - rect.top) * scaleY;
    }

    onMouseMove(event: MouseEvent): void {
        if (!this.isDrawing || !this.ctx) return;
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    onMouseUp(): void {
        this.isDrawing = false;
    }

    onMouseLeave(): void {
        this.isDrawing = false;
    }

    // Touch events
    private handleTouchStart(event: TouchEvent): void {
        event.preventDefault();
        if (event.touches.length !== 1) return;

        this.isDrawing = true;
        const touch = event.touches[0];
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        this.lastX = (touch.clientX - rect.left) * scaleX;
        this.lastY = (touch.clientY - rect.top) * scaleY;
    }

    private handleTouchMove(event: TouchEvent): void {
        event.preventDefault();
        if (!this.isDrawing || !this.ctx || event.touches.length !== 1) return;

        const touch = event.touches[0];
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    private handleTouchEnd(event: TouchEvent): void {
        event.preventDefault();
        this.isDrawing = false;
    }

    // Public method to clear the canvas
    clear(): void {
        if (!this.ctx || !this.canvasRef?.nativeElement) return;
        const canvas = this.canvasRef.nativeElement;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.cleared.emit();
    }
}
