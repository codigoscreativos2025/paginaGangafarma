import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Falta el término de búsqueda' }, { status: 400 });
    }

    const terms = query.trim().split(/\s+/);
    if (terms.length === 0) {
        return NextResponse.json({ results: [] });
    }

    try {
        const whereClause = terms.map(() => `(a.ddetallada LIKE ? OR a.atributos LIKE ? OR a.codigo LIKE ?)`).join(' AND ');
        const queryParams = terms.flatMap(term => [`%${term}%`, `%${term}%`, `%${term}%`]);

        const [rows] = await db.execute(
            `SELECT 
                a.codigo,
                a.ddetallada,
                a.precioventa1 AS precio_local,
                a.pvreferencial1 AS precio_divisa,
                COALESCE(SUM(e.existencia), 0) AS stock_disponible
             FROM v_articulo a
             LEFT JOIN v_articulo_existencia e ON a.codigoarticulo = e.codigoarticulo
             WHERE ${whereClause}
             GROUP BY a.codigo, a.ddetallada, a.precioventa1, a.pvreferencial1
             HAVING stock_disponible > 0
             LIMIT 40`,
            queryParams
        );

        return NextResponse.json({ results: rows });
    } catch (error) {
        console.error('Error al consultar la DB:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}
