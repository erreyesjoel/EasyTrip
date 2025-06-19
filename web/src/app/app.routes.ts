import { Routes } from '@angular/router';
import { Hero } from './hero/hero';
import { IniciarSesion } from './iniciar-sesion/iniciar-sesion';

export const routes: Routes = [
  { path: '', component: Hero },
  { path: 'iniciarSesion', component: IniciarSesion }
];