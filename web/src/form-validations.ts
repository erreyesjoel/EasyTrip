// funcion para validar formularios de paquetes (crear, editar...)
// (gestion-paquetes)
export function validarFormulariosPaquete(form: {
    nombre: string,
    descripcion: string,
    precio_base: number,
    duracion_dias: number,
    cupo_maximo: number
}): string[] {
    const rulesPaquetes = [
        { validacion: !!form.nombre && form.nombre.length >= 3, message: 'El nombre del paquete debe tener al menos 3 caracteres.' },
        { validacion: !!form.descripcion && form.descripcion.length >= 10, message: 'La descripción del paquete debe tener al menos 10 caracteres.' },
        { validacion: form.precio_base > 0, message: 'El precio base debe ser un número positivo.' },
        { validacion: form.duracion_dias > 0, message: 'La duración en días debe ser un número positivo.' },
        { validacion: form.cupo_maximo > 0, message: 'El cupo máximo debe ser un número positivo.' },
    ];

    return rulesPaquetes.filter(rule => !rule.validacion).map(rule => rule.message);
}