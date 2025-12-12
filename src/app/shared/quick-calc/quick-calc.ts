import { Component, signal, ViewChild, ElementRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-quick-calc',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './quick-calc.html',
    styleUrl: './quick-calc.css'
})
export class QuickCalcComponent implements OnInit, OnDestroy {
    @ViewChild('calcInput') calcInput!: ElementRef<HTMLInputElement>;

    isVisible = signal(false);
    inputText = signal('');
    result = signal('');
    showHelp = signal(false);

    // Position for dragging
    position = signal({ x: 0, y: 0 });

    // Drag state
    private isDragging = false;
    private dragOffset = { x: 0, y: 0 };

    // Event handler for custom event
    private quickCalcHandler = () => this.toggle();

    // Unit conversion tables
    private readonly lengthUnits: Record<string, number> = {
        'mm': 0.001, 'cm': 0.01, 'm': 1, 'km': 1000,
        'in': 0.0254, 'ft': 0.3048, 'yd': 0.9144, 'mi': 1609.344
    };

    private readonly weightUnits: Record<string, number> = {
        'mg': 0.000001, 'g': 0.001, 'kg': 1, 't': 1000,
        'oz': 0.0283495, 'lb': 0.453592
    };

    private readonly volumeUnits: Record<string, number> = {
        'ml': 0.001, 'cl': 0.01, 'dl': 0.1, 'l': 1,
        'gal': 3.78541, 'pt': 0.473176, 'qt': 0.946353
    };

    private readonly areaUnits: Record<string, number> = {
        'mm2': 0.000001, 'cm2': 0.0001, 'm2': 1, 'km2': 1000000,
        'ha': 10000, 'ac': 4046.86, 'sqft': 0.092903, 'sqin': 0.00064516
    };

    private readonly timeUnits: Record<string, number> = {
        'ms': 0.001, 's': 1, 'min': 60, 'h': 3600,
        'd': 86400, 'week': 604800
    };

    private readonly weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    private readonly months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    ngOnInit() {
        window.addEventListener('app:quickcalc', this.quickCalcHandler);
    }

    ngOnDestroy() {
        window.removeEventListener('app:quickcalc', this.quickCalcHandler);
    }

    toggle(): void {
        if (this.isVisible()) {
            this.close();
        } else {
            this.open();
        }
    }

    open(): void {
        this.centerModal();
        this.isVisible.set(true);
        this.inputText.set('');
        this.result.set('');

        setTimeout(() => {
            this.calcInput?.nativeElement?.focus();
        }, 0);
    }

    close(): void {
        this.isVisible.set(false);
        this.inputText.set('');
        this.result.set('');
        this.showHelp.set(false);
    }

    toggleHelp(): void {
        this.showHelp.update(v => !v);
    }

    private centerModal(): void {
        const modalWidth = 400;
        const modalHeight = 120;
        const x = Math.max(0, (window.innerWidth - modalWidth) / 2);
        const y = Math.max(0, (window.innerHeight - modalHeight) / 2);
        this.position.set({ x, y });
    }

    onInputChange(): void {
        const input = this.inputText().trim();
        if (!input) {
            this.result.set('');
            return;
        }
        this.result.set(this.evaluate(input));
    }

    onEscape(): void {
        this.close();
    }

    private evaluate(input: string): string {
        // Try different patterns in order

        // 1. Check for date only (DD.MM.YYYY) -> return weekday
        const dateOnlyMatch = input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (dateOnlyMatch) {
            return this.getWeekday(dateOnlyMatch[1], dateOnlyMatch[2], dateOnlyMatch[3]);
        }

        // 2. Check for "today to DATE" pattern
        const todayToMatch = input.match(/^today\s+to\s+(\d{1,2})\.(\d{1,2})\.(\d{4})$/i);
        if (todayToMatch) {
            return this.daysBetweenToday(todayToMatch[1], todayToMatch[2], todayToMatch[3]);
        }

        // 3. Check for date arithmetic: "3week + today" or "today + 3days"
        const dateArithMatch = input.match(/^(\d+)(day|days|week|weeks|month|months|year|years)\s*\+\s*today$/i);
        if (dateArithMatch) {
            return this.addToDate(new Date(), parseInt(dateArithMatch[1]), dateArithMatch[2].toLowerCase());
        }
        const dateArithMatch2 = input.match(/^today\s*([+-])\s*(\d+)(day|days|week|weeks|month|months|year|years)$/i);
        if (dateArithMatch2) {
            const sign = dateArithMatch2[1] === '-' ? -1 : 1;
            return this.addToDate(new Date(), sign * parseInt(dateArithMatch2[2]), dateArithMatch2[3].toLowerCase());
        }

        // 4. Check for specific date arithmetic: "24.12.2025 + 2weeks" or "24.12.2025 - 1month"
        const specificDateArith = input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s*([+-])\s*(\d+)(day|days|week|weeks|month|months|year|years)$/i);
        if (specificDateArith) {
            const baseDate = new Date(
                parseInt(specificDateArith[3]),
                parseInt(specificDateArith[2]) - 1,
                parseInt(specificDateArith[1])
            );
            if (!isNaN(baseDate.getTime())) {
                const sign = specificDateArith[4] === '-' ? -1 : 1;
                return this.addToDate(baseDate, sign * parseInt(specificDateArith[5]), specificDateArith[6].toLowerCase());
            }
        }

        // 5. Check for unit conversion: "3cm in m"
        const unitMatch = input.match(/^([\d.]+)\s*([a-zA-Z2]+)\s+in\s+([a-zA-Z2]+)$/i);
        if (unitMatch) {
            return this.convertUnit(parseFloat(unitMatch[1]), unitMatch[2].toLowerCase(), unitMatch[3].toLowerCase());
        }

        // 6. Try math expression
        return this.evaluateMath(input);
    }

    private getWeekday(day: string, month: string, year: string): string {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isNaN(date.getTime())) {
            return 'Ungültiges Datum';
        }
        return `${this.weekdays[date.getDay()]}, ${day}. ${this.months[parseInt(month) - 1]} ${year}`;
    }

    private daysBetweenToday(day: string, month: string, year: string): string {
        const target = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isNaN(target.getTime())) {
            return 'Ungültiges Datum';
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);

        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Heute';
        if (diffDays === 1) return '1 Tag';
        if (diffDays === -1) return 'Gestern';
        if (diffDays < 0) return `${Math.abs(diffDays)} Tage vergangen`;
        return `${diffDays} Tage`;
    }

    private addToDate(baseDate: Date, amount: number, unit: string): string {
        const date = new Date(baseDate);

        switch (unit) {
            case 'day':
            case 'days':
                date.setDate(date.getDate() + amount);
                break;
            case 'week':
            case 'weeks':
                date.setDate(date.getDate() + amount * 7);
                break;
            case 'month':
            case 'months':
                date.setMonth(date.getMonth() + amount);
                break;
            case 'year':
            case 'years':
                date.setFullYear(date.getFullYear() + amount);
                break;
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}.${month}.${year} (${this.weekdays[date.getDay()]})`;
    }

    private convertUnit(value: number, from: string, to: string): string {
        // Try each unit category
        const categories = [
            { units: this.lengthUnits, name: 'Länge' },
            { units: this.weightUnits, name: 'Gewicht' },
            { units: this.volumeUnits, name: 'Volumen' },
            { units: this.areaUnits, name: 'Fläche' },
            { units: this.timeUnits, name: 'Zeit' }
        ];

        for (const category of categories) {
            if (category.units[from] !== undefined && category.units[to] !== undefined) {
                const baseValue = value * category.units[from];
                const result = baseValue / category.units[to];
                // Format with appropriate precision
                const formatted = result < 0.01 ? result.toExponential(2) :
                    result % 1 === 0 ? result.toString() :
                        result.toFixed(4).replace(/\.?0+$/, '');
                return `${formatted} ${to}`;
            }
        }

        // Temperature conversion (special case)
        if ((from === 'c' || from === '°c') && (to === 'f' || to === '°f')) {
            const f = (value * 9 / 5) + 32;
            return `${f.toFixed(1)} °F`;
        }
        if ((from === 'f' || from === '°f') && (to === 'c' || to === '°c')) {
            const c = (value - 32) * 5 / 9;
            return `${c.toFixed(1)} °C`;
        }
        if ((from === 'c' || from === '°c') && (to === 'k')) {
            return `${(value + 273.15).toFixed(2)} K`;
        }
        if ((from === 'k') && (to === 'c' || to === '°c')) {
            return `${(value - 273.15).toFixed(2)} °C`;
        }

        return 'Unbekannte Einheit';
    }

    private evaluateMath(expression: string): string {
        // Only allow safe characters for math
        const safeExpr = expression.replace(/\s/g, '');
        if (!/^[\d+\-*/().%^]+$/.test(safeExpr)) {
            return '';
        }

        try {
            // Replace ^ with ** for exponentiation
            const jsExpr = safeExpr.replace(/\^/g, '**');
            // Use Function to evaluate (safer than eval)
            const result = new Function(`return ${jsExpr}`)();

            if (typeof result === 'number' && isFinite(result)) {
                // Format result nicely
                if (Number.isInteger(result)) {
                    return result.toString();
                }
                return result.toFixed(6).replace(/\.?0+$/, '');
            }
            return '';
        } catch {
            return '';
        }
    }

    // Drag functionality
    startDrag(event: MouseEvent | TouchEvent): void {
        this.isDragging = true;
        const pos = this.position();

        if (event instanceof MouseEvent) {
            this.dragOffset = {
                x: event.clientX - pos.x,
                y: event.clientY - pos.y
            };
        } else {
            const touch = event.touches[0];
            this.dragOffset = {
                x: touch.clientX - pos.x,
                y: touch.clientY - pos.y
            };
        }

        event.preventDefault();
    }

    @HostListener('document:mousemove', ['$event'])
    @HostListener('document:touchmove', ['$event'])
    onDrag(event: MouseEvent | TouchEvent): void {
        if (!this.isDragging) return;

        let clientX: number, clientY: number;

        if (event instanceof MouseEvent) {
            clientX = event.clientX;
            clientY = event.clientY;
        } else {
            const touch = event.touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        }

        const newX = Math.max(0, Math.min(clientX - this.dragOffset.x, window.innerWidth - 400));
        const newY = Math.max(0, Math.min(clientY - this.dragOffset.y, window.innerHeight - 120));

        this.position.set({ x: newX, y: newY });
    }

    @HostListener('document:mouseup')
    @HostListener('document:touchend')
    onDragEnd(): void {
        this.isDragging = false;
    }
}
