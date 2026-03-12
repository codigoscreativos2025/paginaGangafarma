import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const logs = await prisma.userActionLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100 // Últimas acciones
        });

        // Fetch action info
        const codigosUnicos = Array.from(new Set(logs.map((l: any) => `'${l.codigo}'`)));
        let productsMap: Record<string, string> = {};

        if (codigosUnicos.length > 0) {
            const codigosUnidos = codigosUnicos.join(',');
            const [rows]: any = await db.execute(`SELECT codigoarticulo, ddetallada FROM v_articulo WHERE codigoarticulo IN (${codigosUnidos})`);
            rows.forEach((r: any) => { productsMap[r.codigoarticulo] = r.ddetallada; });
        }

        const enrichedLogs = logs.map(l => ({
            id: l.id,
            actionType: l.actionType,
            codigo: l.codigo,
            timestamp: l.timestamp,
            userType: l.userId ? 'Usuario Registrado' : 'Visitante Anónimo',
            ddetallada: productsMap[l.codigo] || 'Desconocido'
        }));

        return NextResponse.json({ logs: enrichedLogs });
    } catch (e) {
        console.error("Analytics Error", e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
