import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar'; // Usa la ruta correcta según tu estructura
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.html',   // <--- debe existir este archivo
  styleUrl: './dashboard.scss'       // <--- debe existir este archivo
})
export class DashboardComponent {}