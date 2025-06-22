import { Routes } from '@angular/router';
import { Hero } from './hero/hero';
import { IniciarSesion } from './iniciar-sesion/iniciar-sesion';
import { DashboardComponent } from './dashboard/dashboard';import { AdminGuard } from './guards/admin.guard';
import { GestionPaquetes } from './gestion-paquetes/gestion-paquetes';
export const routes: Routes = [
  { path: '', component: Hero },
  { path: 'iniciarSesion', component: IniciarSesion },
  // La ruta 'dashboard' solo es accesible para usuarios con rol administrador gracias a AdminGuard
  { path: 'dashboard', component: DashboardComponent, canActivate: [AdminGuard] },
  { path: 'gestion-paquetes', component: GestionPaquetes, canActivate: [AdminGuard] },
];