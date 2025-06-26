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
  modalAbierto = false; // por defecto en false, si lo dejas en true, te saldra abierto por defecto, no queremos eso jajaja
  modalEliminarAbierto = false; // por defecto en false, si lo dejas en true, te saldra abierto por defecto, no queremos eso jajaja
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

  // Modal de edición (existente)
  // si abres el modal, se cargan los datos actuales del paquete en el formulario
  // aqui si true, porque el modal esta abierto
  abrirModal(): void {
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

  // como cierras el modal, modalAbierto se vuelve false
  cerrarModal(): void {
    this.modalAbierto = false;
  }

  // Guardar cambios del formulario
  // si el formulario es válido, se guarda el paquete
  guardarCambios(): void {
    if (this.formularioPaquete.valid) {
      this.paqueteActual = {
        ...this.paqueteActual,
        ...this.formularioPaquete.value
      };
      
      console.log('Paquete guardado:', this.paqueteActual);
      this.cerrarModal();
    }
  }

  // Modal de eliminación (nuevo)
  // true, porque aqui simulamos que el modal está abierto
  abrirModalEliminar(): void {
    this.modalEliminarAbierto = true;
  }

  // como cierras el modal, modalEliminarAbierto se vuelve false
  cerrarModalEliminar(): void {
    this.modalEliminarAbierto = false;
  }

  eliminarPaquete(): void {
    console.log('Eliminando paquete:', this.paqueteActual.id);
    // Aquí iría la llamada a tu API para eliminar
    // Por ejemplo: this.paquetesService.eliminarPaquete(this.paqueteActual.id).subscribe(...)
    
    this.cerrarModalEliminar();
    // Después podrías redirigir o actualizar la lista de paquetes
  }
}