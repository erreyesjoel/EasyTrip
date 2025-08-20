import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar'; // Usa la ruta correcta según tu estructura
import { environment } from '../../environments/environment';

interface UsuariosCountResponse {
  total: number;
  activos: number;
  inactivos: number;
  agentes: number;
  clientes: number;
  administradores: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.html',   // <--- debe existir este archivo
  styleUrl: './dashboard.scss'       // <--- debe existir este archivo
})
export class DashboardComponent {

  totalUsuarios: number | null = null;

  // ngOnInit, cada vez que se renderia componente, llama a mostrarTotalUsuarios
  ngOnInit():void {
    this.mostrarTotalUsuarios();
  }

  async mostrarTotalUsuarios(): Promise<void> {
    try {
      const res = await fetch(environment.apiBaseUrl + 'count-usuarios');
      if (!res.ok) throw new Error('Error al obtener el total de usuarios');
      const data: UsuariosCountResponse = await res.json();
      this.totalUsuarios = data.total;
    } catch (error) {
      this.totalUsuarios = null;
      console.error('Error al mostrar total de usuarios:', error);
    }
  }
}
