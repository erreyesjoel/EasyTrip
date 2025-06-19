import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mensajes',
  templateUrl: './mensajes.html',
  styleUrls: ['./mensajes.scss'],
  standalone: true,
  imports: [CommonModule] // Importamos CommonModule para usar directivas comunes como ngIf, ngFor, etc.
})
export class MensajesComponent {
  @Input() tipo: 'error' | 'exito' = 'exito';
  @Input() mensaje: string = '';
}