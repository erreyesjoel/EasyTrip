// funcion para validar formularios de paquetes (crear, editar...)
// (gestion-paquetes)
export function validarFormulariosPaquete(form: {
    nombre: string,
    descripcion: string,
    precio_base: number,
    duracion_dias: number,
    cupo_maximo: number,
    imagenes?: File[]
}): string[] {
    const validacionesPaquetes = [
        { validacion: !!form.nombre && form.nombre.length >= 5, message: 'El nombre del paquete debe tener al menos 5 caracteres.' },
        { validacion: form.nombre.length <= 30, message: 'El nombre del paquete no puede exceder los 30 caracteres.' },
        { validacion: !!form.descripcion && form.descripcion.length >= 10, message: 'La descripción del paquete debe tener al menos 10 caracteres.' },
        { validacion: form.descripcion.length <= 40, message: 'La descripción del paquete no puede exceder los 40 caracteres.' },
        { validacion: form.precio_base > 0, message: 'El precio base debe ser un número positivo.' },
        { validacion: form.duracion_dias > 0, message: 'La duración en días debe ser un número positivo.' },
        { validacion: form.cupo_maximo > 0, message: 'El cupo máximo debe ser un número positivo.' },
    ];
    
    // Validar imágenes si existen
    if (form.imagenes && form.imagenes.length > 0) {
        form.imagenes.forEach((img, idx) => {
            if (img.size > 4 * 1024 * 1024) { // 4 MB
                validacionesPaquetes.push({
                    validacion: false,
                    message: `La imagen ${idx + 1} supera el tamaño máximo de 4 MB.`
                });
            }
        });
    }

    return validacionesPaquetes.filter(rule => !rule.validacion).map(rule => rule.message);
}

export function validacionFormatoEmail(email: string) {
  return {
    validacion: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    message: 'El email no tiene un formato válido'
  };
}

export function validarCrearUsuario(form: {
  username: string,
  email: string,
  first_name: string,
  last_name: string
}): string[] {
  const validacionesCrearUsuario = [
    { validacion: !!form.username && form.username.length >= 3, message: 'El nombre de usuario debe tener al menos 3 caracteres.' },
    { validacion: form.username.length <= 30, message: 'El nombre de usuario no puede exceder los 30 caracteres.' },
    { validacion: !!form.email && validacionFormatoEmail(form.email).validacion, message: 'El email no tiene un formato válido.' },
    { validacion: !!form.first_name && form.first_name.length >= 2, message: 'El nombre debe tener al menos 2 caracteres.' },
    { validacion: form.first_name.length <= 30, message: 'El nombre no puede exceder los 30 caracteres.' },
    { validacion: !!form.last_name && form.last_name.length >= 2, message: 'El apellido debe tener al menos 2 caracteres.' },
    { validacion: form.last_name.length <= 30, message: 'El apellido no puede exceder los 30 caracteres.' },
    { validacion: form.email.length <= 150, message: 'El email no puede exceder los 150 caracteres.' }
  ];
  return validacionesCrearUsuario.filter(rule => !rule.validacion).map(rule => rule.message);
}