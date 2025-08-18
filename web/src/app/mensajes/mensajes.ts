import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mensajes',
  templateUrl: './mensajes.html',
  styleUrls: ['./mensajes.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class MensajesComponent {
  // para "definir" el tipo de mensaje
  @Input() tipo: 'error' | 'exito' | 'error-form' | undefined = 'exito';  
  @Input() mensaje: string | undefined = '';
}