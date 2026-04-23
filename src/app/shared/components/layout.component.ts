import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './layout.component.html',
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .main-content { flex: 1; margin-left: 240px; padding: 32px; min-height: 100vh; background: var(--gray-50); }
    @media (max-width: 768px) { .main-content { margin-left: 0; padding: 16px; } }
  `],
})
export class LayoutComponent {}
