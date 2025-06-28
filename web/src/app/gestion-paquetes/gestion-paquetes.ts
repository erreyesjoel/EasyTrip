import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar';
import { environment } from '../../environments/environment';

// Interfaz para manejar las imágenes que vienen del backend
interface ImagenPaquete {
  id: number;
  descripcion: string;
  imagen_url: string;
}

// Interfaz para manejar los paquetes que vienen del backend (API)
interface PaqueteApi {
  id: number;
  nombre: string;
  descripcion: string;
  precio_base: number; // En la API se llama precio_base
  duracion_dias: number; // En la API se llama duracion_dias
  cupo_maximo: number; // En la API se llama cupo_maximo
  estado: string;
  imagenes: ImagenPaquete[]; // Array de imágenes
}

interface PaqueteTuristico {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion: number;
  cupo: number;
  estado: string;
  imagen_url?: string; // URL de la imagen del paquete turístico (opcional, usamos ? para marcar como opcional)
}

@Component({
  selector: 'app-gestion-paquetes',
  standalone: true,
  imports: [SidebarComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-paquetes.html',
  styleUrl: './gestion-paquetes.scss'
})
export class GestionPaquetes implements OnInit {
  modalAbierto = false; // por defecto en false, si lo dejas en true, te saldra abierto por defecto, no queremos eso jajaja
  modalEliminarAbierto = false; // por defecto en false, si lo dejas en true, te saldra abierto por defecto, no queremos eso jajaja
  formularioPaquete: FormGroup;
  
  // URL base de la API, se obtiene del entorno
  baseUrl = environment.apiBaseUrl;
  
  // URL de la imagen predeterminada
  imagenPredeterminada: string;

  // Datos de ejemplo y para mantener el tipo
  paquetes: PaqueteTuristico[] = []; // Array para todos los paquetes
  paqueteActual: PaqueteTuristico = {
    nombre: '',
    descripcion: '',
    precio: 0,
    duracion: 0,
    cupo: 0,
    estado: 'activo',
    imagen_url: ''
  };
  
  modoCreacion = false;

  // Arrays para gestionar imágenes en el modal
  imagenesPreview: { file: File, url: string }[] = []; // Imágenes nuevas seleccionadas (aún no subidas)
  imagenesExistentes: ImagenPaquete[] = []; // Imágenes ya guardadas en el backend (solo en edición)
  imagenesEliminadas: number[] = []; // IDs de imágenes existentes a eliminar (solo en edición)

constructor(private fb: FormBuilder) {
  // Configuramos la URL de la imagen predeterminada
  try {
    const urlObj = new URL(this.baseUrl);
    const baseUrlCorrecta = `${urlObj.protocol}//${urlObj.host}`;
    this.imagenPredeterminada = `${baseUrlCorrecta}/static/img/paquetePredeterminada.webp`;
  } catch (error) {
    console.error('Error al construir la URL de la imagen predeterminada:', error);
    this.imagenPredeterminada = `${this.baseUrl}/static/img/paquetePredeterminada.webp`;
  }
  
  // Ahora podemos asignar la imagen predeterminada
  this.paqueteActual.imagen_url = this.imagenPredeterminada;
  
  // Inicializamos el formulario
  this.formularioPaquete = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: ['', Validators.required],
    precio: [0, [Validators.required, Validators.min(0.01)]],
    duracion: [1, [Validators.required, Validators.min(1)]],
    cupo: [1, [Validators.required, Validators.min(1)]],
    estado: ['activo']
  });
}

  // Este método se ejecutará cuando se inicialice el componente
  ngOnInit(): void {
    this.cargarPaquete();
  }

  // Método para asegurarnos de que las URLs de imágenes usen el dominio correcto
  corregirUrl(url: string): string {
    if (url.startsWith('http')) {
      // Si ya es una URL completa, la devolvemos tal cual
      return url;
    } else {
      // Si es una ruta relativa, añadimos el dominio base
      try {
        const urlObj = new URL(this.baseUrl);
        const baseUrlCorrecta = `${urlObj.protocol}//${urlObj.host}`;
        // Si la URL comienza con /, no añadimos barra adicional
        return url.startsWith('/') 
          ? `${baseUrlCorrecta}${url}` 
          : `${baseUrlCorrecta}/${url}`;
      } catch (error) {
        // En caso de error, devolvemos la URL original
        return url;
      }
    }
  }

  // Método para cargar un paquete usando fetch y async/await
  async cargarPaquete(): Promise<void> {
    // URL del endpoint para obtener paquetes
    // Verificamos y corregimos la URL base para evitar duplicaciones
    console.log('baseUrl original:', this.baseUrl);

    try {
      // Creamos un objeto URL para manipularlo fácilmente
      const urlObj = new URL(this.baseUrl);
      // Construimos la URL correcta sin duplicación
      const baseUrlCorrecta = `${urlObj.protocol}//${urlObj.host}`;
      const url = `${baseUrlCorrecta}/api/paquetes/`;

      console.log('URL final de petición:', url);

      // Hacemos la petición con fetch usando async/await
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar los paquetes');
      }

      const paquetesApi: PaqueteApi[] = await response.json();

      if (paquetesApi && paquetesApi.length > 0) {
        // Convertimos todos los paquetes al formato que usa nuestro componente
        this.paquetes = paquetesApi.map(paquete => ({
          id: paquete.id,
          nombre: paquete.nombre,
          descripcion: paquete.descripcion,
          precio: paquete.precio_base,
          duracion: paquete.duracion_dias,
          cupo: paquete.cupo_maximo,
          estado: paquete.estado,
          imagen_url: paquete.imagenes && paquete.imagenes.length > 0 
            ? this.corregirUrl(paquete.imagenes[0].imagen_url) 
            : this.imagenPredeterminada
        }));

        // Seleccionamos el primer paquete como actual
        this.paqueteActual = this.paquetes[0];
        console.log('Paquetes cargados:', this.paquetes);
      }
    } catch (error) {
      console.error('Error al construir la URL o al cargar los paquetes:', error);
    }
  }

  // Método para manejar errores de carga de imagen
  cargarImagenPredeterminada(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.imagenPredeterminada;
  }
  
  // Modal de edición (existente)
  // si abres el modal, se cargan los datos actuales del paquete en el formulario
  // aqui si true, porque el modal esta abierto
  abrirModal(paquete?: PaqueteTuristico): void {
    if (paquete) {
      this.paqueteActual = paquete;
      // Cargamos imágenes existentes del paquete (si las hay)
      this.imagenesExistentes = (paquete as any).imagenes || [];
      this.imagenesEliminadas = [];
      this.imagenesPreview = [];
    } else {
      this.imagenesExistentes = [];
      this.imagenesEliminadas = [];
      this.imagenesPreview = [];
    }
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
    this.modoCreacion = false;
  }

  // Abre el modal en modo creación
  abrirModalCrear(): void {
    this.modoCreacion = true;
    this.formularioPaquete.reset({
      nombre: '',
      descripcion: '',
      precio: 0,
      duracion: 1,
      cupo: 1,
      estado: 'activo'
    });
    this.imagenesPreview = [];
    this.imagenesExistentes = [];
    this.imagenesEliminadas = [];
    this.modalAbierto = true;
  }

  // Método para manejar la selección de imágenes nuevas (input file)
  onImagenesSeleccionadas(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagenesPreview.push({ file, url: e.target.result });
        };
        reader.readAsDataURL(file);
      });
      // Limpiar el input para permitir volver a seleccionar la misma imagen si se elimina
      input.value = '';
    }
  }

  // Elimina una imagen de la preview (aún no subida)
  eliminarImagenPreview(index: number): void {
    this.imagenesPreview.splice(index, 1);
  }

  // Elimina una imagen existente (ya subida al backend)
  eliminarImagenExistente(index: number): void {
    const img = this.imagenesExistentes[index];
    if (img && img.id) {
      this.imagenesEliminadas.push(img.id);
      this.imagenesExistentes.splice(index, 1);
    }
  }

  // Guardar cambios del formulario
  // si el formulario es válido, se guarda el paquete
  async guardarCambios(): Promise<void> {
    if (this.formularioPaquete.valid) {
      // Usamos FormData para enviar imágenes y datos
      const formData = new FormData();
      formData.append('nombre', this.formularioPaquete.value.nombre);
      formData.append('descripcion', this.formularioPaquete.value.descripcion);
      formData.append('precio_base', this.formularioPaquete.value.precio);
      formData.append('duracion_dias', this.formularioPaquete.value.duracion);
      formData.append('cupo_maximo', this.formularioPaquete.value.cupo);
      formData.append('estado', this.formularioPaquete.value.estado);

      // Añadir imágenes nuevas (si hay)
      this.imagenesPreview.forEach((img) => {
        formData.append('imagenes', img.file);
      });

      // Añadir IDs de imágenes a eliminar (solo en edición)
      if (!this.modoCreacion && this.imagenesEliminadas.length > 0) {
        formData.append('imagenes_eliminar', JSON.stringify(this.imagenesEliminadas));
      }

      const urlObj = new URL(this.baseUrl);
      const baseUrlCorrecta = `${urlObj.protocol}//${urlObj.host}`;
      let endpoint = '';
      let method: 'POST' | 'PUT' = 'POST';

      if (this.modoCreacion) {
        endpoint = `${baseUrlCorrecta}/api/crear-paquete/`;
        method = 'POST';
      } else {
        endpoint = `${baseUrlCorrecta}/api/editar-paquete/${this.paqueteActual.id}/`;
        method = 'PUT';
      }

      try {
        const res = await fetch(endpoint, {
          method,
          body: formData
        });
        if (!res.ok) throw new Error('Error al guardar el paquete');
        await this.cargarPaquete();
        this.cerrarModal();
      } catch (error) {
        console.error('Error al guardar el paquete:', error);
      }
    }
  }

  // Modal de eliminación (nuevo)
  // true, porque aqui simulamos que el modal está abierto
  abrirModalEliminar(paquete?: PaqueteTuristico): void {
    if (paquete) {
      this.paqueteActual = paquete;
    }
    this.modalEliminarAbierto = true;
  }

  // como cierras el modal, modalEliminarAbierto se vuelve false
  cerrarModalEliminar(): void {
    this.modalEliminarAbierto = false;
  }

  // PROMISE se usa en typescript para manejar operaciones asíncronas
  // Este método se encarga de eliminar un paquete usando fetch y async/await
  // Aquí usamos el método DELETE para eliminar el paquete seleccionado

  async eliminarPaquete(): Promise<void> {
    console.log('Eliminando paquete:', this.paqueteActual.id);
    // Aquí iría la llamada a tu API para eliminar usando fetch
    try {
      const urlObj = new URL(this.baseUrl);
      const baseUrlCorrecta = `${urlObj.protocol}//${urlObj.host}`;
      const endpoint = `${baseUrlCorrecta}/api/eliminar-paquete/${this.paqueteActual.id}/`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Error al eliminar el paquete');
      }

      const data = await res.json();
      console.log('Respuesta de eliminación:', data);
      // Recargamos la lista de paquetes para ver los cambios reflejados
      this.cargarPaquete();
      this.cerrarModalEliminar();
    } catch (error) {
      console.error('Error al eliminar el paquete:', error);
    }
  }
  

  // Método para seleccionar un paquete específico desde la lista o el selector
  seleccionarPaquete(paqueteOEvento: PaqueteTuristico | Event): void {
    if (paqueteOEvento instanceof Event) {
      // Si es un evento (select change)
      const selectElement = paqueteOEvento.target as HTMLSelectElement;
      const id = Number(selectElement.value);
      this.paqueteActual = this.paquetes.find(p => p.id === id) || this.paquetes[0];
    } else {
      // Si es un objeto paquete (click en tarjeta)
      this.paqueteActual = paqueteOEvento;
    }
    console.log('Paquete seleccionado:', this.paqueteActual);
  }
}