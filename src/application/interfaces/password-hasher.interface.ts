/**
 * Contrato para el servicio de cifrado y verificación segura de contraseñas.
 */
export interface IPasswordHasher {
  /**
   * Genera un hash seguro con salt para una contraseña en texto plano.
   */
  hash(password: string): Promise<string>;

  /**
   * Compara una contraseña en texto plano con un hash existente.
   */
  compare(password: string, hash: string): Promise<boolean>;
}
