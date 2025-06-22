import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

// hero ts
@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  standalone: true
})
export class Hero implements AfterViewInit {
  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;

  constructor(private router: Router) {
    this.checkAdminRedirect();
  }

  async checkAdminRedirect() {
    try {
      const res = await fetch(environment.apiBaseUrl + 'usuario/', {
        credentials: 'include'
      });
      if (res.ok) {
        const usuario = await res.json();
        if (usuario.rol === 'administrador') {
          this.router.navigate(['/dashboard']);
        }
      }
    } catch {}
  }

  ngAfterViewInit() {
    if (this.heroVideo && this.heroVideo.nativeElement) {
      this.heroVideo.nativeElement.muted = true;
      this.heroVideo.nativeElement.play().catch(() => {});
    }
  }
}