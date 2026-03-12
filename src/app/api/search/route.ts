import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Falta el término de búsqueda' }, { status: 400 });
    }

    try {
        const searchTerm = `%${query}%`;
        const [rows] = await db.execute(
            `SELECT v.*, e.existencia, e.costo, e.tasapublico
       FROM v_articulo v
       LEFT JOIN v_articulo_existencia e ON v.id = e.id_art
       WHERE v.ddetallada LIKE ? OR v.codigo LIKE ?
       LIMIT 20`,
            [searchTerm, searchTerm]
        );

        return NextResponse.json({ results: rows });
    } catch (error) {
        console.error('Error al consultar la DB:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}
