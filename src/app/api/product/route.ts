import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Falta el ID del producto' }, { status: 400 });
    }

    try {
        const [result] = await db.execute(
            `SELECT v.*, e.existencia, e.costo, e.tasapublico, e.fv
       FROM v_articulo v
       LEFT JOIN v_articulo_existencia e ON v.id = e.id_art
       WHERE v.id = ? LIMIT 1`,
            [id]
        );

        const rows = Array.isArray(result) ? result : [];

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        const product = rows[0] as Record<string, unknown>;

        // Buscar si existe un Overwrite local para este codigo
        const override = await prisma.productOverride.findUnique({
            where: { codigo: String(product.codigo) || '' }
        });

        const finalProduct = {
            ...product,
            override: override || null
        };

        return NextResponse.json({ product: finalProduct });
    } catch (error) {
        console.error('Error al consultar el producto:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}
