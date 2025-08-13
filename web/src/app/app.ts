import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from './header/header';
import { Hero } from './hero/hero';
import { Footer } from './footer/footer';
import { MostrarPaquetes } from './mostrar-paquetes/mostrar-paquetes';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Header, Hero, Footer, MostrarPaquetes],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'web';
  usuario: any = null;
  cargando = true;

  constructor(private router: Router) {}

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

  mostrarHeaderFooter(): boolean {
    // Oculta header/footer solo en la ruta /definir-password
    const ocultarEn = ['/definir-password'];
    // Si la ruta actual está en la lista, no mostrar header/footer
    return !ocultarEn.includes(this.router.url.split('?')[0]);
  }
}