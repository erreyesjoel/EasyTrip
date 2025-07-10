import { Routes } from '@angular/router';
import { Hero } from './hero/hero';
import { MostrarPaquetes } from './mostrar-paquetes/mostrar-paquetes';
import { IniciarSesion } from './iniciar-sesion/iniciar-sesion';
import { DashboardComponent } from './dashboard/dashboard';
import { AdminGuard } from './guards/admin.guard';
import { GestionPaquetes } from './gestion-paquetes/gestion-paquetes';
import { GestionUsuarios } from './gestion-usuarios/gestion-usuarios';
import { DetallesPaquete } from './detalles-paquete/detalles-paquete';
import { Reserva } from './reserva/reserva';

export const routes: Routes = [
  {
    path: '',
    component: Hero,
    children: [
      { path: '', component: MostrarPaquetes }
    ]
  },
  { path: 'iniciarSesion', component: IniciarSesion },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AdminGuard] },
  { path: 'gestion-paquetes', component: GestionPaquetes, canActivate: [AdminGuard] },
  { path: 'usuarios', component: GestionUsuarios, canActivate: [AdminGuard] },
  { path: 'detalles-paquete/:id', component: DetallesPaquete }, // sin guard para acceso público
  { path: 'reserva/:id', component: Reserva }
];