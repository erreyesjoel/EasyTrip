import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar';
import { environment } from '../../environments/environment';
import { Notificaciones } from '../notificaciones/notificaciones';
import { MensajesComponent } from '../mensajes/mensajes';
import { validarFormulariosPaquete } from '../../form-validations';
import { PaginacionGestion } from '../paginacion-gestion/paginacion-gestion';

// Interfaz para manejar las imágenes que vienen del backend
interface ImagenPaquete {
  id: number;
  descripcion: string;
  imagen_url: string;
}

interface Usuario {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: string; // 'administrador', 'agente', etc.
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
  imagenes?: ImagenPaquete[];
}

@Component({
  selector: 'app-gestion-paquetes',
  standalone: true,
  imports: [SidebarComponent, CommonModule, ReactiveFormsModule, Notificaciones, MensajesComponent, PaginacionGestion],
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

  usuario: Usuario | null = null; // Usuario autenticado, puede ser null si no hay sesión iniciada

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

  // Mapa para guardar el índice de la imagen actual de cada paquete (por id)
  imagenActualPorPaquete: { [paqueteId: number]: number } = {};

  // Nueva propiedad para la imagen ampliada
  imagenAmpliada: string | null = null;

  // Referencia al componente de notificaciones
  @ViewChild('notificaciones') notificacionesRef!: Notificaciones;

  erroresForm: { [campo: string]: string } = {};

  // Paginación
  paginaActual = 1;
  totalPaginas = 1;
  pageSize = 3; /* cada pagina muestra 3 paquetes
  dependiendo del numero que pongamos, el fetch 
  cambiara el page_size y se veran mas o menos paquetes 
  ejemplo con 3, 3 paquetes por pagina
  /api/paquetes/?page=1&page_size=3 */
  opcionesPageSize = [3, 6, 9, 20, 0]; // 0 hara referencia a TODOS

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
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required, Validators.maxLength(300)]],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      duracion: [1, [Validators.required, Validators.min(1)]],
      cupo: [1, [Validators.required, Validators.min(1)]],
      estado: ['activo']
    });
  }

  // peticion a api usuario, que nos devuelve el rol (lo mas importante)
  // para saber si el usuario es administrador o agente, y mostrar los botones de editar y eliminar
  // si es rol administrador, se muestran los botones de crear, editar, y eliminar paquete
  // si es agente, solo podrá filtrar y visualizar paquetes, pero no crear, editar ni eliminar.
  async verificarUsuario() {
    try {
      const apiBaseUrl = (window as any)['NG_APP_API_BASE_URL'];
      const res = await fetch(apiBaseUrl + 'usuario/', { credentials: 'include' });
      if (res.ok) {
        this.usuario = await res.json();
        console.log('Usuario es:', this.usuario);
      }
    } catch {
      this.usuario = null;
    }
  }

  // Este método se ejecutará cuando se inicialice el componente
  ngOnInit(): void {
    this.cargarPaquete();
    this.verificarUsuario();
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
    // Construimos la URL base para la API de paquetes turísticos
    // Usamos los parámetros de paginación: page y page_size
    try {
      const urlObj = new URL(this.baseUrl);
      const baseUrlCorrecta = `${urlObj.protocol}//${urlObj.host}`;
      // Añadimos los parámetros de paginación
      const pageSizeParam = this.pageSize === 0 ? 9999 : this.pageSize;
      const url = `${baseUrlCorrecta}/api/paquetes/?page=${this.paginaActual}&page_size=${pageSizeParam}`;

      console.log('URL final de petición:', url);

      // Hacemos la petición con fetch usando async/await
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar los paquetes');
      }

      // La respuesta de la API paginada tiene la forma:
      // { results: [...], total: X, page: Y, page_size: Z, total_pages: N }
      const data = await response.json();

      // Convertimos los paquetes al formato que usa nuestro componente
      this.paquetes = (data.results || []).map((paquete: any) => ({
        id: paquete.id,
        nombre: paquete.nombre,
        descripcion: paquete.descripcion,
        precio: paquete.precio_base,
        duracion: paquete.duracion_dias,
        cupo: paquete.cupo_maximo,
        estado: paquete.estado,
        imagen_url: paquete.imagenes && paquete.imagenes.length > 0
          ? this.corregirUrl(paquete.imagenes[0].imagen_url)
          : this.imagenPredeterminada,
        imagenes: paquete.imagenes // Para el carrusel
      }));

      // Actualizamos los datos de paginación
      this.totalPaginas = data.total_pages || 1;
      this.paginaActual = data.page || 1;
      this.pageSize = data.page_size || this.pageSize;

      // Seleccionamos el primer paquete como actual (opcional)
      if (this.paquetes.length > 0) {
        this.paqueteActual = this.paquetes[0];
      }

      console.log('Paquetes cargados:', this.paquetes);
      console.log('Paginación:', {
        paginaActual: this.paginaActual,
        totalPaginas: this.totalPaginas,
        pageSize: this.pageSize
      });
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
    this.formularioPaquete.reset({
      nombre: '',
      descripcion: '',
      precio: 0,
      duracion: 1,
      cupo: 1,
      estado: 'activo'
    });
    this.erroresForm = {}; // limpia los errores del formulario
    this.imagenesPreview = [];
    this.imagenesExistentes = [];
    this.imagenesEliminadas = [];
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
      try {
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
          // Mensaje personalizado según si es creación o edición
          if (this.modoCreacion) {
            this.notificacionesRef.mostrar(`¡Paquete ${this.formularioPaquete.value.nombre} creado con éxito!`, 'success');
          } else {
            this.notificacionesRef.mostrar(`¡Paquete ${this.paqueteActual.nombre} editado con éxito!`, 'success');
          }
          this.cerrarModal();
          await this.cargarPaquete();
        } catch (error) {
          // Mensaje de error también personalizado
          if (this.modoCreacion) {
            this.notificacionesRef.mostrar(`Error al crear el paquete ${this.formularioPaquete.value.nombre}`, 'error');
          } else {
            this.notificacionesRef.mostrar(`Error al editar el paquete ${this.paqueteActual.nombre}`, 'error');
          }
        }
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

      // si la respuesta NO es exitosa
      if (!res.ok) {
        throw new Error('Error al eliminar el paquete');
      } else { // SI la respuesta es exitosa, mostramos la notificacion, paqueteActual, ya que lo estamos "editando"
        this.notificacionesRef.mostrar(`¡Paquete ${this.paqueteActual.nombre} eliminado con éxito!`, 'success');
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

  // Devuelve la URL de la imagen actual a mostrar en la tarjeta
  getImagenActualTarjeta(paquete: PaqueteTuristico): string {
    if (typeof paquete.id === 'undefined') {
      return this.imagenPredeterminada;
    }
    const idx = this.imagenActualPorPaquete[paquete.id] || 0;
    if (paquete.imagenes && paquete.imagenes.length > 0) {
      const safeIdx = ((idx % paquete.imagenes.length) + paquete.imagenes.length) % paquete.imagenes.length;
      return this.corregirUrl(paquete.imagenes[safeIdx].imagen_url);
    }
    return this.imagenPredeterminada;
  }

  // Cambia la imagen actual del carrusel de la tarjeta (izquierda/derecha)
  cambiarImagenTarjeta(paquete: PaqueteTuristico, cambio: number): void {
    if (!paquete.imagenes || paquete.imagenes.length < 2) return;
    if (typeof paquete.id === 'undefined') return; // <-- Solución

    const actual = this.imagenActualPorPaquete[paquete.id] || 0;
    let nuevo = actual + cambio;
    if (nuevo < 0) nuevo = paquete.imagenes.length - 1;
    if (nuevo >= paquete.imagenes.length) nuevo = 0;
    this.imagenActualPorPaquete[paquete.id] = nuevo;
  }

  // Método para abrir la imagen ampliada
  abrirImagenAmpliada(url: string) {
    this.imagenAmpliada = url;
  }

  // Método para cerrar la imagen ampliada
  cerrarImagenAmpliada() {
    this.imagenAmpliada = null;
  }

  async filtrarPaquetes(): Promise<void> {
  // Recoge los valores de los filtros usando querySelector
  const nombre = (document.querySelector('#filtroNombre') as HTMLInputElement)?.value || '';
  const estado = (document.querySelector('#filtroEstado') as HTMLSelectElement)?.value || '';
  const precio = (document.querySelector('#filtroPrecio') as HTMLInputElement)?.value || '';
  const duracion = (document.querySelector('#filtroDuracion') as HTMLInputElement)?.value || '';
  const cupo = (document.querySelector('#filtroCupo') as HTMLInputElement)?.value || '';

  // Construye la query string solo con los filtros que tengan valor
  const params = new URLSearchParams();
  if (nombre) params.append('nombre', nombre);
  if (estado) params.append('estado', estado);
  if (precio) params.append('precio_base', precio);
  if (duracion) params.append('duracion', duracion);
  if (cupo) params.append('cupo', cupo);

  const urlObj = new URL(this.baseUrl);
  const baseUrlCorrecta = `${urlObj.protocol}//${urlObj.host}`;
  const url = `${baseUrlCorrecta}/api/paquetes/${params.toString() ? '?' + params.toString() : ''}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al filtrar los paquetes');
    const paquetesApi = await response.json();
    const listaPaquetes = Array.isArray(paquetesApi) ? paquetesApi : (paquetesApi.results || []);
    this.paquetes = listaPaquetes.map((paquete: PaqueteApi) => ({
      id: paquete.id,
      nombre: paquete.nombre,
      descripcion: paquete.descripcion,
      precio: paquete.precio_base,
      duracion: paquete.duracion_dias,
      cupo: paquete.cupo_maximo,
      estado: paquete.estado,
      imagen_url: paquete.imagenes && paquete.imagenes.length > 0 
        ? this.corregirUrl(paquete.imagenes[0].imagen_url) 
        : this.imagenPredeterminada,
      imagenes: paquete.imagenes
    }));
    // Si quieres, puedes resetear el paqueteActual aquí
  } catch (error) {
    console.error('Error al filtrar los paquetes:', error);
  }
}

reiniciarFiltros(): void {
  (document.querySelector('#filtroNombre') as HTMLInputElement).value = '';
  (document.querySelector('#filtroEstado') as HTMLSelectElement).value = '';
  (document.querySelector('#filtroPrecio') as HTMLInputElement).value = '';
  (document.querySelector('#filtroDuracion') as HTMLInputElement).value = '';
  (document.querySelector('#filtroCupo') as HTMLInputElement).value = '';
  this.filtrarPaquetes();
}

actualizarErroresForm() {
  const valores = {
    nombre: this.formularioPaquete.get('nombre')?.value,
    descripcion: this.formularioPaquete.get('descripcion')?.value,
    precio_base: this.formularioPaquete.get('precio')?.value,
    duracion_dias: this.formularioPaquete.get('duracion')?.value,
    cupo_maximo: this.formularioPaquete.get('cupo')?.value,
    imagenes: this.imagenesPreview.map(img => img.file) 
  };
  const mensajes = validarFormulariosPaquete(valores);
  this.erroresForm = {};
  mensajes.forEach(msg => {
    if (msg.includes('nombre')) this.erroresForm['nombre'] = msg;
    if (msg.includes('descripción')) this.erroresForm['descripcion'] = msg;
    if (msg.includes('precio')) this.erroresForm['precio'] = msg;
    if (msg.includes('duración')) this.erroresForm['duracion'] = msg;
    if (msg.includes('cupo')) this.erroresForm['cupo'] = msg;
    if (msg.includes('imagen')) this.erroresForm['imagenes'] = msg; // <-- Añade esto

  });
}

// Métodos para manejar los eventos de paginación
onPaginaCambiada(nuevaPagina: number) {
  this.paginaActual = nuevaPagina;
  this.cargarPaquete();
}

onPageSizeCambiado(nuevoSize: number) {
  this.pageSize = nuevoSize;
  this.paginaActual = 1; // Vuelve a la primera página
  this.cargarPaquete();
}
}