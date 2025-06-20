import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  usuario: any = null;
  menuAbierto = false; // <-- Añade esto

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.cargarUsuario();
  }

  async cargarUsuario() {
    try {
      const res = await fetch(environment.apiBaseUrl + 'usuario/', {
        credentials: 'include'
      });
      if (res.ok) {
        this.usuario = await res.json();
      } else {
        this.usuario = null;
      }
    } catch {
      this.usuario = null;
    }
    this.cdr.detectChanges(); // <-- Fuerza actualización de la vista
  }

  async logout() {
    await fetch(environment.apiBaseUrl + 'logout/', {
      method: 'POST',
      credentials: 'include'
    });
    this.usuario = null;
    window.location.href = '/'; // Redirige a la home después de cerrar sesión
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }
}