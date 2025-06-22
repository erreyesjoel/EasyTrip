import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <-- Agrega esto

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule], // <-- Agrega RouterModule aquí
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  usuario: any = null;

  async ngOnInit() {
    try {
      const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
      const res = await fetch(apiBaseUrl + 'usuario/', { credentials: 'include' });
      if (res.ok) {
        this.usuario = await res.json();
      }
    } catch {
      this.usuario = null;
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  async logout() {
    const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
    await fetch(apiBaseUrl + 'logout/', {
      method: 'POST',
      credentials: 'include'
    });
    window.location.href = '/';
  }
}