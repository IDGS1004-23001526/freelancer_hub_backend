/**
 * Value Object para la URL o ruta de la imagen de perfil.
 */

export class Avatar {
  private constructor(public readonly url: string) {}

  public static create(url: string): Avatar {
    // Validamos que la ruta no llegue vacía o con espacios en blanco
    if (!url || url.trim() === "") {
      throw new Error("La ruta del avatar no puede estar vacía");
    }
    return new Avatar(url);
  }
}