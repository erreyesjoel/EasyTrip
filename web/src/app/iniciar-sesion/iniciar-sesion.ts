import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.html',
  styleUrl: './iniciar-sesion.scss',
  imports: [CommonModule]
})
export class IniciarSesion {
  modoRegistro = false; // modo registro false, porque por defecto se muestra el login
  modoRecuperacion = false; // modo recuperacion false, porque por defecto se muestra el login

  mostrarRegistro() {
    this.modoRegistro = true; // modo registro true, porque se ha pulsado el boton de registro
    this.modoRecuperacion = false; // modo recuperacion false, porque se ha pulsado el boton de registro, y NO el de recuperacion
  }

  mostrarLogin() {
    this.modoRegistro = false; // modo registro false, porque se ha pulsado el boton de login
    this.modoRecuperacion = false; // modo recuperacion false, porque se ha pulsado el boton de login, y NO el de recuperacion
  }

  mostrarRecuperacion() {
    this.modoRegistro = false; // modo registro false, porque se ha pulsado el boton de recuperacion, y NO el de registro
    this.modoRecuperacion = true; // modo recuperacion true, porque se ha pulsado el boton de recuperacion
  }
}