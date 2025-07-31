import { Routes } from '@angular/router';
import { Hero } from './hero/hero';
import { MostrarPaquetes } from './mostrar-paquetes/mostrar-paquetes';
import { IniciarSesion } from './iniciar-sesion/iniciar-sesion';
import { DashboardComponent } from './dashboard/dashboard';
import { AdminGuard } from './guards/admin.guard';
import { AdminOrAgenteGuard } from './guards/admin-or-agente.guard';
import { GestionPaquetes } from './gestion-paquetes/gestion-paquetes';
import { GestionUsuarios } from './gestion-usuarios/gestion-usuarios';
import { DetallesPaquete } from './detalles-paquete/detalles-paquete';
import { Reserva } from './reserva/reserva';
import { GestionReservas } from './gestion-reservas/gestion-reservas';
import { Paquetes } from './paquetes/paquetes';

export const routes: Routes = [
  {
    path: '',
    component: Hero,
    children: [
      { path: '', component: MostrarPaquetes }
    ]
  },
  { path: 'iniciarSesion', component: IniciarSesion },

  // Ruta accesible para administradores o agentes
  { path: 'dashboard', component: DashboardComponent, canActivate: [AdminOrAgenteGuard] },

  // Exclusivo para administradores
  { path: 'gestion-paquetes', component: GestionPaquetes, canActivate: [AdminOrAgenteGuard] },
  { path: 'gestion-reservas', component: GestionReservas, canActivate: [AdminOrAgenteGuard]},
  { path: 'usuarios', component: GestionUsuarios, canActivate: [AdminGuard] },

  // Rutas públicas
  { path: 'detalles-paquete/:id', component: DetallesPaquete },
  { path: 'reserva/:id/:nombre', component: Reserva },
  { path: 'paquetes', component: Paquetes }, // ruta para ver todos los paquetes
];
