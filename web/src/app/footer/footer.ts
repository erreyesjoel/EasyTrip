import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer implements OnInit {
  usuario: any = null;

  async ngOnInit() {
    try {
      const res = await fetch((window as any)['NG_APP_API_BASE_URL'] + 'usuario/', {
        credentials: 'include'
      });
      if (res.ok) {
        this.usuario = await res.json();
      }
    } catch {
      this.usuario = null;
    }
  }
}
