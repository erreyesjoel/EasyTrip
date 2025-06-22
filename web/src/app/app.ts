import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; // <-- IMPORTA ESTO
import { Header } from './header/header';
import { Hero } from './hero/hero';
import { Footer } from './footer/footer';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Header, Hero, Footer], // <-- AGREGA CommonModule AQUÍ
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'web';
  usuario: any = null;
  cargando = true;

  async ngOnInit() {
    await this.cargarUsuario();
  }

  async cargarUsuario() {
    try {
      const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
      const res = await fetch(apiBaseUrl + 'usuario/', {
        credentials: 'include'
      });
      if (res.ok) {
        this.usuario = await res.json();
        console.log('Usuario detectado en App:', this.usuario);
      } else {
        this.usuario = null;
        console.log('No autenticado');
      }
    } catch (e) {
      this.usuario = null;
      console.log('Error al consultar usuario', e);
    }
    this.cargando = false;
  }

  get esAdmin() {
    return this.usuario && (this.usuario.rol?.toLowerCase?.() === 'administrador');
  }
}