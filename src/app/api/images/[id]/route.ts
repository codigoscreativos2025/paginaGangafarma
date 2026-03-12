import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    // Las imágenes subidas viviran en {UPLOAD_DIR} para persistencia en EasyPanel
    const UPLOAD_DIR = path.join(process.cwd(), process.env.NODE_ENV === 'production' ? '../db/uploads' : './public/uploads');

    try {
        const filePath = path.join(UPLOAD_DIR, params.id);
        if (!fs.existsSync(filePath)) {
            return new NextResponse('Imagen no encontrada', { status: 404 });
        }

        const { size } = fs.statSync(filePath);
        const fileStream = fs.createReadStream(filePath);

        // Determine mime type simple
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };

        return new NextResponse(fileStream as unknown as ReadableStream, {
            headers: {
                'Content-Type': mimeTypes[ext] || 'application/octet-stream',
                'Content-Length': size.toString()
            }
        });
    } catch (error) {
        console.error('Error de imagen:', error);
        return new NextResponse('Error del servidor', { status: 500 });
    }
}
