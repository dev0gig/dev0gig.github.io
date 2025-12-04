import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/theme.service';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { RightSidebarComponent } from './shared/right-sidebar/right-sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, RightSidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Inject ThemeService to ensure it's initialized on app start
  private themeService = inject(ThemeService);
}
