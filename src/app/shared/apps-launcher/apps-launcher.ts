import { Component, inject } from '@angular/core';
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

    toggleSidebar() {
        this.sidebarService.toggle();
    }
}
