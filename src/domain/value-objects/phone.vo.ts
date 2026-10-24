/**
 * Value Object (Objeto de Valor) para el Teléfono.
 * En DDD, los Value Objects no tienen identidad (ID) y son inmutables.
 * Su principal objetivo es encapsular las reglas de validación del dato.
 */

export class Phone {
  // El constructor es privado para forzar el uso del método de fábrica 'create'.
  // Esto garantiza que no se pueda instanciar un teléfono inválido.
  private constructor(public readonly value: string) {}

  public static create(value: string): Phone {
    // Validación estricta usando el estándar internacional E.164
    const regex = /^\+?[1-9]\d{1,14}$/; 
    if (!regex.test(value)) {
      // Si falla la validación, lanzamos un error de dominio que detiene el flujo
      throw new Error("Formato de teléfono inválido");
    }
    return new Telephone(value);
  }
}