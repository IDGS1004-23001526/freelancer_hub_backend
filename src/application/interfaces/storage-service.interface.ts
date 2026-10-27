/**
 * Contrato para el servicio de almacenamiento (local o en la nube tipo S3).
 */
export interface IStorageService {
  /**
   * Sube un archivo a partir de un buffer y retorna la URL o ruta pública accesible.
   */
  upload(file: Buffer, filename: string): Promise<string>;
}
