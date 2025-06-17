import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.html',
  styleUrl: './iniciar-sesion.scss',
  imports: [CommonModule]
})
export class IniciarSesion {
  modoRegistro = false;

  mostrarRegistro() {
    this.modoRegistro = true;
  }

  mostrarLogin() {
    this.modoRegistro = false;
  }
}