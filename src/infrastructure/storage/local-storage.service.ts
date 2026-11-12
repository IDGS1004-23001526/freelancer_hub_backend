import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { IStorageService } from '../../application/interfaces/storage-service.interface.js';

/**
 * Implementación concreta del servicio de almacenamiento en disco local.
 * Compatible con Node.js 
 */
export class LocalStorageService implements IStorageService {
  async upload(file: Buffer, filename: string): Promise<string> {
    // Definimos la carpeta de subidas en la raíz del proyecto
    const uploadDir = path.join(process.cwd(), 'uploads');

    // Si la carpeta no existe, la crea de forma recursiva
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const baseName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${baseName}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Escribe el Buffer en el disco físico
    await fs.promises.writeFile(filePath, file);

    // Retorna la ruta relativa que se guardará en la BD y servirá al frontend
    return `/uploads/${uniqueFilename}`;
  }
}