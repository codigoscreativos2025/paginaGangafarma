'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

type ProductDetail = {
    codigo: string;
    ddetallada: string;
    override?: {
        description?: string;
        howToUse?: string;
        warnings?: string;
        imageUrl?: string;
    }
};

export default function AdminDashboard() {
    const { data: session, status } = useSession();

    const [codigo, setCodigo] = useState('');
    const [productData, setProductData] = useState<ProductDetail | null>(null);

    const [desc, setDesc] = useState('');
    const [howToUse, setHowToUse] = useState('');
    const [warnings, setWarnings] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    if (status === 'loading') return <p className="p-10 text-center">Cargando...</p>;
    if (!session || (session.user as { role: string }).role !== 'ADMIN') {
        return (
            <div className="p-10 text-center">
                <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
                <p>Solo los administradores pueden ver esta página.</p>
                <Link href="/" className="text-primary hover:underline mt-4 block">Volver al inicio</Link>
            </div>
        );
    }

    const handleSearch = async () => {
        if (!codigo) return;
        setLoading(true);
        setMsg({ text: '', type: '' });
        try {
            // Buscar directamente por termino general para identificarlo rapido
            const res = await fetch(`/api/search?q=${encodeURIComponent(codigo)}`);
            const data = await res.json();

            if (data.results && data.results.length > 0) {
                // Encontramos el primero
                const id = data.results[0].id;
                // Pedimos los datos completos (que incluyen el Override)
                const fullRes = await fetch(`/api/product?id=${id}`);
                const fullData = await fullRes.json();

                if (fullData.product) {
                    setProductData(fullData.product);
                    setDesc(fullData.product.override?.description || '');
                    setHowToUse(fullData.product.override?.howToUse || '');
                    setWarnings(fullData.product.override?.warnings || '');
                    setMsg({ text: `Producto "${fullData.product.ddetallada}" encontrado`, type: 'success' });
                }
            } else {
                setMsg({ text: 'Código o nombre no encontrado', type: 'error' });
                setProductData(null);
            }
        } catch {
            setMsg({ text: 'Error buscando producto', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productData) return;

        setLoading(true);
        setMsg({ text: '', type: '' });

        try {
            const formData = new FormData();
            formData.append('codigo', productData.codigo);
            formData.append('description', desc);
            formData.append('howToUse', howToUse);
            formData.append('warnings', warnings);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const res = await fetch('/api/admin/product', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                setMsg({ text: 'Cambios guardados exitosamente!', type: 'success' });
                setTimeout(() => handleSearch(), 1000); // refresh
            } else {
                setMsg({ text: 'Error al guardar', type: 'error' });
            }
        } catch {
            setMsg({ text: 'Error en la petición de guardado', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6">
                <div className="flex items-center gap-2 text-primary mb-8 pb-4 border-b border-primary/10">
                    <span className="material-symbols-outlined text-2xl">security</span>
                    <h2 className="text-xl font-bold">Admin Panel</h2>
                </div>
                <nav className="space-y-4">
                    <a href="#" className="flex items-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-lg font-medium">
                        <span className="material-symbols-outlined">inventory_2</span>
                        Productos
                    </a>
                    <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-3 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium w-full text-left transition-colors">
                        <span className="material-symbols-outlined">logout</span>
                        Cerrar Sesión
                    </button>
                </nav>
            </aside>

            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-800 mb-8">Gestión de Productos</h1>

                    {/* Buscador */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                        <h3 className="font-semibold text-slate-700 mb-4">Buscar Producto para Editar</h3>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Código de barras o Nombre exacto..."
                                className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value)}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50"
                            >
                                Buscar
                            </button>
                        </div>
                        {msg.text && (
                            <p className={`mt-4 text-sm font-medium ${msg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                {msg.text}
                            </p>
                        )}
                    </div>

                    {/* Editor */}
                    {productData && (
                        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="mb-6 pb-6 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-primary">{productData.ddetallada}</h2>
                                    <p className="text-slate-500 text-sm mt-1">Código: {productData.codigo}</p>
                                </div>
                                {productData.override?.imageUrl && (
                                    <Image src={productData.override.imageUrl} width={80} height={80} alt="preview" className="object-cover rounded-lg border border-slate-200" />
                                )}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Reemplazar Imagen del Producto</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">La imagen se guardará localmente en el volumen del servidor.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Descripción Personalizada</label>
                                    <textarea
                                        rows={4}
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Escribe la descripción detallada del producto aquí..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Cómo usar</label>
                                    <textarea
                                        rows={3}
                                        value={howToUse}
                                        onChange={(e) => setHowToUse(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Instrucciones de uso..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Advertencias (Peligro rojo)</label>
                                    <textarea
                                        rows={3}
                                        value={warnings}
                                        onChange={(e) => setWarnings(e.target.value)}
                                        className="w-full border border-red-200 bg-red-50 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                                        placeholder="Contraindicaciones y efectos secundarios..."
                                    />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-4">
                                <button type="button" onClick={() => setProductData(null)} className="px-6 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={loading} className="bg-primary text-white px-8 py-2 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">save</span>
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
