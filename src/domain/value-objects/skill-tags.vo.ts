import { InsufficientSkillTagsException } from "../exceptions/domain.exception.js";

/**
 * Value Object => Conjunto de tags de habilidades con minimo de 3 habilidades sin duplicados
 * 
 * Description: Representa una colección inmutable y autovalidada de habilidades (skills).
 * - Sanitiza cada entrada eliminando espacios innecesarios e ignorando textos vacíos.
 * - Filtra duplicados de forma insensible a mayúsculas/minúsculas (case-insensitive).
 * - Asegura la regla de negocio de contar con al menos 3 habilidades únicas.
 * - Protege el estado interno retornando siempre una copia del arreglo.
 * 
 * @throws {InsufficientSkillTagsException} Si tras la limpieza quedan menos de 3 habilidades válidas.
 */

export class SkillTags {
    public static readonly MIN_TAGS = 3;
    private readonly _values: string[];

    constructor(tags: string[]) {
        const vistos = new Set<string>();
        const limpios: string[] = [];

        for (const tag of tags ?? []) {
            const nombre = String(tag).trim().replace(/\s+/g, '');
            const clave = nombre.toLowerCase();

            if (nombre && !vistos.has(clave)) {
                vistos.add(clave);
                limpios.push(nombre);
            }
        }

        if (limpios.length < SkillTags.MIN_TAGS) {
            throw new InsufficientSkillTagsException(SkillTags.MIN_TAGS);
        }
        this._values = limpios;
    }

    public get values(): string[] {
        return [...this._values];
    }
}