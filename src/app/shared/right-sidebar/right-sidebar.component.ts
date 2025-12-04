import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../sidebar.service';

@Component({
    selector: 'app-right-sidebar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './right-sidebar.component.html',
    styleUrl: './right-sidebar.component.css'
})
export class RightSidebarComponent {
    sidebarService = inject(SidebarService);

    toggleSidebar() {
        this.sidebarService.toggleRight();
    }
}
