import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar';

interface PaqueteTuristico {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion: number;
  cupo: number;
  estado: string;
}

@Component({
  selector: 'app-gestion-paquetes',
  standalone: true,
  imports: [SidebarComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-paquetes.html',
  styleUrl: './gestion-paquetes.scss'
})
export class GestionPaquetes {
  modalAbierto = false;
  formularioPaquete: FormGroup;
  
  // Datos de ejemplo (luego vendrán de una API)
  paqueteActual: PaqueteTuristico = {
    id: 1,
    nombre: 'Título del Paquete',
    descripcion: 'Una escapada inolvidable para toda la familia.',
    precio: 50,
    duracion: 5,
    cupo: 20,
    estado: 'activo'
  };

  constructor(private fb: FormBuilder) {
    this.formularioPaquete = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      duracion: [1, [Validators.required, Validators.min(1)]],
      cupo: [1, [Validators.required, Validators.min(1)]],
      estado: ['activo']
    });
  }

  abrirModal(): void {
    // Inicializa el formulario con los valores actuales
    this.formularioPaquete.patchValue({
      nombre: this.paqueteActual.nombre,
      descripcion: this.paqueteActual.descripcion,
      precio: this.paqueteActual.precio,
      duracion: this.paqueteActual.duracion,
      cupo: this.paqueteActual.cupo,
      estado: this.paqueteActual.estado
    });
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarCambios(): void {
    if (this.formularioPaquete.valid) {
      // Actualiza el paquete actual con los valores del formulario
      this.paqueteActual = {
        ...this.paqueteActual,
        ...this.formularioPaquete.value
      };
      
      console.log('Paquete guardado:', this.paqueteActual);
      // Aquí iría la llamada a tu API para guardar los cambios
      
      this.cerrarModal();
    }
  }
}