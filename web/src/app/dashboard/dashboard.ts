import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar';
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

interface PaquetesCountResponse {
  total: number;
  activos: number;
  inactivos: number;
}

declare var google: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  totalUsuarios: number | null = null;
  usuariosActivos: number | null = null;
  usuariosNoActivos: number | null = null;
  totalReservas: number | null = null;
  totalPaquetes: number | null = null;
  paquetesActivos: number | null = null;
  paquetesNoActivos: number | null = null;
  reservasPorMesLabels: string[] = [];
  reservasPorMesData: number[] = [];
  usuariosPorMesLabels: string[] = [];
  usuariosPorMesData: number[] = [];

  private chartsReady = false;
  private datosReady = false;
  private usuariosDatosReady = false;

  constructor() {}

  ngOnInit(): void {
    // Carga Google Charts solo una vez
    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(() => {
      this.chartsReady = true;
      this.tryDrawChart();
      this.tryDrawUsuariosChart();
    });

    this.mostrarTotalUsuarios();
    this.mostrarTotalReservas();
    this.mostrarTotalPaquetes();
    this.cargarReservasPorMes();
    this.cargarUsuariosPorMes();
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

  async mostrarTotalPaquetes(): Promise<void> {
    try {
      const res = await fetch(environment.apiBaseUrl + 'count-paquetes');
      if (!res.ok) throw new Error('Error al obtener el total de paquetes');
      const data: PaquetesCountResponse = await res.json();
      this.totalPaquetes = data.total;
      this.paquetesActivos = data.activos;
      this.paquetesNoActivos = data.inactivos;
      console.log('Total de paquetes:', data);
    } catch (error) {
      this.totalPaquetes = null;
      this.paquetesActivos = null;
      this.paquetesNoActivos = null;
      console.error('Error al mostrar total de paquetes:', error);
    }
  }

  async cargarReservasPorMes(): Promise<void> {
    try {
      const res = await fetch(environment.apiBaseUrl + 'reservas-por-mes/');
      if (!res.ok) throw new Error('Error al obtener reservas por mes');
      const data = await res.json();
      this.reservasPorMesLabels = data.map((item: any) => item.mes);
      this.reservasPorMesData = data.map((item: any) => item.total);
      this.datosReady = true;
      this.tryDrawChart();
    } catch (error) {
      this.reservasPorMesLabels = [];
      this.reservasPorMesData = [];
      this.datosReady = false;
      console.error('Error al cargar reservas por mes:', error);
    }
  }

  async cargarUsuariosPorMes(): Promise<void> {
    try {
      const res = await fetch(environment.apiBaseUrl + 'usuarios-por-mes/');
      if (!res.ok) throw new Error('Error al obtener usuarios por mes');
      const data = await res.json();
      this.usuariosPorMesLabels = data.map((item: any) => item.mes);
      this.usuariosPorMesData = data.map((item: any) => item.total);
      this.usuariosDatosReady = true;
      this.tryDrawUsuariosChart();
    } catch (error) {
      this.usuariosPorMesLabels = [];
      this.usuariosPorMesData = [];
      this.usuariosDatosReady = false;
      console.error('Error al cargar usuarios por mes:', error);
    }
  }

  tryDrawChart() {
    if (this.chartsReady && this.datosReady && this.reservasPorMesLabels.length > 0) {
      this.dibujarGrafico();
    }
  }

  tryDrawUsuariosChart() {
    if (this.chartsReady && this.usuariosDatosReady && this.usuariosPorMesLabels.length > 0) {
      this.dibujarUsuariosChart();
    }
  }

  dibujarGrafico() {
    const chartData = [
      ['Mes', 'Reservas'],
      ...this.reservasPorMesLabels.map((mes, i) => [mes, this.reservasPorMesData[i]])
    ];
    const data = google.visualization.arrayToDataTable(chartData);
    const chart = new google.visualization.ColumnChart(document.getElementById('grafico-reservas'));
    chart.draw(data, { title: 'Reservas por mes', legend: { position: 'none' } });
  }

  dibujarUsuariosChart() {
    const chartData = [
      ['Mes', 'Usuarios'],
      ...this.usuariosPorMesLabels.map((mes, i) => [mes, this.usuariosPorMesData[i]])
    ];
    const data = google.visualization.arrayToDataTable(chartData);
    const chart = new google.visualization.ColumnChart(document.getElementById('grafico-usuarios'));
    chart.draw(data, { title: 'Usuarios registrados por mes', legend: { position: 'none' } });
  }
}
