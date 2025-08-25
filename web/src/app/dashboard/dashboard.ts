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

interface ReservasCountResponse {
  total: number;
  pendientes: number;
  confirmadas: number;
  pagadas: number;
  canceladas: number;
  finalizadas: number;
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
  usuariosActivos: number | null = null;
  usuariosNoActivos: number | null = null;
  totalReservas: number | null = null;

  // ngOnInit, cada vez que se renderia componente, llama a mostrarTotalUsuarios
  ngOnInit():void {
    this.mostrarTotalUsuarios();
    this.mostrarTotalReservas();
  }

  async mostrarTotalUsuarios(): Promise<void> {
    try {
      const res = await fetch(environment.apiBaseUrl + 'count-usuarios');
      if (!res.ok) throw new Error('Error al obtener el total de usuarios');
      const data: UsuariosCountResponse = await res.json();
      this.totalUsuarios = data.total;
      this.usuariosActivos = data.activos;
      this.usuariosNoActivos = data.inactivos;
    } catch (error) {
      this.totalUsuarios = null;
      this.usuariosActivos = null;
      this.usuariosNoActivos = null;
      console.error('Error al mostrar total de usuarios:', error);
    }
  }

  async mostrarTotalReservas(): Promise<void> {
    try {
      const res = await fetch(environment.apiBaseUrl + 'count-reservas');
      if (!res.ok) throw new Error('Error al obtener el total de reservas');
      const data: ReservasCountResponse = await res.json();
      this.totalReservas = data.total;
      console.log('Total de reservas:', data);
      // Aquí puedes asignar los datos a variables de clase si es necesario
    } catch (error) {
      this.totalReservas = null;
      console.error('Error al mostrar total de reservas:', error);
    }
  }
}
