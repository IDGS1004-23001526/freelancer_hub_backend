import fs from 'fs';
import path from 'path';
import { IStorageService } from '../../application/interfaces/storage-service.interface';

/**
 * Implementación concreta del servicio de almacenamiento.
 * Interactúa directamente con el sistema de archivos (File System) de Node.js.
 */

export class LocalStorageService implements IStorageService {
  async upload(file: Buffer, filename: string): Promise<string> {
    // Definimos la ruta absoluta donde se guardarán las imágenes
    const uploadDir = path.join(__dirname, '../../../uploads');
    
    // Si la carpeta no existe, la crea dinámicamente
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    
    const filePath = path.join(uploadDir, filename);
    
    // Escribe el Buffer en el disco físico
    fs.writeFileSync(filePath, file);
    
    // Retorna la ruta relativa que se guardará en la BD y servirá para el Frontend
    return `/uploads/${filename}`;
  }
}