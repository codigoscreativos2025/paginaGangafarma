import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const logs = await prisma.userActionLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100 // Últimas acciones
        });

        // Fetch action info
        const codigosUnicos = Array.from(new Set(logs.map((l: { codigo: string }) => `'${l.codigo}'`)));
        const productsMap: Record<string, string> = {};

        if (codigosUnicos.length > 0) {
            const codigosUnidos = codigosUnicos.join(',');
            const [rows] = await db.execute<RowDataPacket[]>(`SELECT codigoarticulo, ddetallada FROM v_articulo WHERE codigoarticulo IN (${codigosUnidos})`);
            (rows as { codigoarticulo: string, ddetallada: string }[]).forEach((r) => { productsMap[r.codigoarticulo] = r.ddetallada; });
        }

        const enrichedLogs = logs.map((l: { id: string, actionType: string, codigo: string, timestamp: Date, userId: string | null }) => ({
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
