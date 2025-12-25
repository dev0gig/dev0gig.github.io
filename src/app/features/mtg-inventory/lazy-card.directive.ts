import { Directive, ElementRef, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';

/**
 * Directive that emits when an element enters the viewport
 * Used for lazy loading card details
 */
@Directive({
    selector: '[appLazyCard]',
    standalone: true
})
export class LazyCardDirective implements OnInit, OnDestroy {
    private elementRef = inject(ElementRef);
    private observer: IntersectionObserver | null = null;

    @Output() appLazyCard = new EventEmitter<void>();

    ngOnInit(): void {
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.appLazyCard.emit();
                        // Unobserve after first trigger (one-time load)
                        this.observer?.unobserve(this.elementRef.nativeElement);
                    }
                });
            },
            {
                root: null, // viewport
                rootMargin: '100px', // preload 100px before entering viewport
                threshold: 0
            }
        );

        this.observer.observe(this.elementRef.nativeElement);
    }

    ngOnDestroy(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}
