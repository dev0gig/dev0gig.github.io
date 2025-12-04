import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../sidebar.service';

@Component({
    selector: 'app-apps-launcher',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './apps-launcher.html',
    styleUrl: './apps-launcher.css'
})
export class AppsLauncher {
    sidebarService = inject(SidebarService);
    openSettings = output<void>();

    toggleSidebar() {
        this.sidebarService.toggle();
    }
}
