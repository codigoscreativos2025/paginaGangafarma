'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [cedula, setCedula] = useState('');
    const [telefono, setTelefono] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await signIn('credentials', {
                cedula,
                telefono,
                redirect: false,
            });

            if (res?.error) {
                setError('Cédula o teléfono incorrecto');
            } else {
                router.refresh();
                router.push('/');
            }
        } catch {
            setError('Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-end sm:items-center justify-center bg-slate-50 p-0 sm:p-4">
            <div className="max-w-md w-full bg-white rounded-t-3xl sm:rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-4">
                        <span className="material-symbols-outlined text-4xl">medical_services</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Bienvenido a GangaFarma</h2>
                    <p className="text-slate-500 mt-2 text-base">Inicia sesión con tu cédula y teléfono</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-base text-center mb-6 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-base font-bold text-slate-700 mb-2">Cédula de Identidad</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            required
                            className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg"
                            placeholder="Ej: 12345678"
                            value={cedula}
                            onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>

                    <div>
                        <label className="block text-base font-bold text-slate-700 mb-2">Teléfono</label>
                        <input
                            type="tel"
                            inputMode="tel"
                            required
                            className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg"
                            placeholder="Ej: 04121234567"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 px-4 rounded-2xl transition-all flex justify-center items-center gap-2 text-lg shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? <span className="material-symbols-outlined animate-spin text-2xl">refresh</span> : '🔑 Entrar'}
                    </button>

                    <p className="text-center text-base text-slate-500 mt-4">
                        ¿No tienes cuenta? <Link href="/register" className="text-primary hover:underline font-bold">Regístrate aquí</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
