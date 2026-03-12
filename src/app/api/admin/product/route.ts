import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    const session = await auth();

    // Requerimos que el usuario exista y sea ADMIN
    if (!session || session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;
        const codigo = formData.get('codigo') as string;
        const description = formData.get('description') as string;
        const howToUse = formData.get('howToUse') as string;
        const warnings = formData.get('warnings') as string;

        if (!codigo) {
            return NextResponse.json({ error: 'Se requiere el código del producto' }, { status: 400 });
        }

        let imageUrl = null;

        if (file && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const ext = path.extname(file.name) || '.jpg';
            const filename = `${codigo}-${Date.now()}${ext}`;

            const UPLOAD_DIR = path.join(process.cwd(), process.env.NODE_ENV === 'production' ? '../db/uploads' : './public/uploads');

            // Crear directorio si no existe (importante para el primer uso en EasyPanel)
            if (!fs.existsSync(UPLOAD_DIR)) {
                fs.mkdirSync(UPLOAD_DIR, { recursive: true });
            }

            const filePath = path.join(UPLOAD_DIR, filename);
            fs.writeFileSync(filePath, buffer);

            // La URL relativa que servirá el endpoint GET de imágenes que ya creamos
            imageUrl = `/api/images/${filename}`;
        }

        // Upsert the Product Override
        const override = await prisma.productOverride.upsert({
            where: { codigo: codigo },
            update: {
                description: description || undefined,
                howToUse: howToUse || undefined,
                warnings: warnings || undefined,
                ...(imageUrl && { imageUrl }),
            },
            create: {
                codigo,
                description,
                howToUse,
                warnings,
                ...(imageUrl && { imageUrl }),
            }
        });

        return NextResponse.json({ success: true, override });
    } catch (error) {
        console.error('Error procesando subida:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
