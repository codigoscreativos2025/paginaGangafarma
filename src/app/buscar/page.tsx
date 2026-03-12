'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartContext';
import { useLoginModal } from '@/components/LoginModalContext';

type Product = {
    id: number;
    codigo: string;
    ddetallada: string;
    stock_disponible: string;
    precio_local: string;
    precio_divisa: string;
};

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const router = useRouter();

    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { openCart, items, addToCart } = useCart();
    const { openModal } = useLoginModal();
    const [addingMap, setAddingMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!query) {
            setLoading(false);
            return;
        }
        setLoading(true);
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                setResults(data.results || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching search results:', err);
                setLoading(false);
            });
    }, [query]);

    const handleAddToCart = async (product: Product) => {
        setAddingMap(prev => ({ ...prev, [product.codigo]: true }));
        await addToCart({
            codigo: product.codigo,
            ddetallada: product.ddetallada,
            price: parseFloat(product.precio_divisa || '0'),
            quantity: 1,
            image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
        });
        setAddingMap(prev => ({ ...prev, [product.codigo]: false }));
    };

    return (
        <div className="relative flex min-h-screen flex-col bg-slate-50">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white px-4 md:px-10 py-3">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 md:gap-8">
                    <div className="flex items-center gap-4 md:gap-8">
                        <Link href="/" className="flex items-center gap-2 text-primary">
                            <span className="material-symbols-outlined text-3xl">medical_services</span>
                            <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">GangaFarma</h2>
                        </Link>
                        <div className="hidden lg:flex items-center gap-6">
                            <Link className="text-slate-600 text-sm font-medium hover:text-primary transition-colors" href="#">Medicinas</Link>
                            <Link className="text-slate-600 text-sm font-medium hover:text-primary transition-colors" href="#">Bienestar</Link>
                            <Link className="text-slate-600 text-sm font-medium hover:text-primary transition-colors" href="#">Cuidado Personal</Link>
                            <Link className="text-slate-600 text-sm font-medium hover:text-primary transition-colors" href="#">Ofertas</Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex gap-2 relative">
                            <button onClick={openCart} className="relative flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 text-slate-700 hover:bg-primary/10 hover:text-primary transition-all">
                                <span className="material-symbols-outlined">shopping_cart</span>
                                {items.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                        {items.length}
                                    </span>
                                )}
                            </button>
                            <button onClick={openModal} className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 text-slate-700 hover:bg-primary/10 hover:text-primary transition-all">
                                <span className="material-symbols-outlined">person</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex max-w-[1440px] mx-auto w-full px-4 md:px-10 py-6 gap-8">
                {/* Sidebar Filters (Mock) */}
                <aside className="hidden md:flex flex-col w-64 shrink-0 gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Filtros</h3>
                        <div className="space-y-4">
                            <div className="border-b border-slate-200 pb-4">
                                <div className="flex items-center justify-between cursor-pointer mb-2">
                                    <span className="text-sm font-semibold">Categoría</span>
                                    <span className="material-symbols-outlined text-slate-400">expand_more</span>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-slate-600">
                                        <input defaultChecked className="rounded text-primary focus:ring-primary border-slate-300" type="checkbox" /> Analgésicos
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-600">
                                        <input className="rounded text-primary focus:ring-primary border-slate-300" type="checkbox" /> Antibióticos
                                    </label>
                                </div>
                            </div>
                            <div className="border-b border-slate-200 pb-4">
                                <div className="flex items-center justify-between cursor-pointer mb-2">
                                    <span className="text-sm font-semibold">Disponibilidad</span>
                                    <span className="material-symbols-outlined text-slate-400">expand_more</span>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                    <input defaultChecked className="rounded text-primary focus:ring-primary border-slate-300" type="checkbox" /> En Stock
                                </label>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    <nav className="flex text-sm text-slate-500 mb-6 gap-2 items-center">
                        <Link className="hover:text-primary" href="/">Inicio</Link>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="font-medium text-slate-900">Resultados de Búsqueda</span>
                    </nav>

                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Resultados de Búsqueda</h1>
                        <p className="text-slate-500">
                            {loading ? 'Buscando resultados...' : `Mostrando ${results.length} resultados para "${query}"`}
                        </p>
                    </div>

                    {!loading && results.length > 0 && (
                        <div className="flex flex-col gap-6">
                            {results.map((item) => (
                                <div key={item.codigo} className="group flex flex-col md:flex-row bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                                    <div
                                        onClick={() => router.push(`/producto/${item.codigo}`)}
                                        className="w-full md:w-64 h-64 md:h-auto bg-slate-50 flex items-center justify-center p-4 cursor-pointer relative"
                                    >
                                        <Image
                                            src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                                            alt={item.ddetallada}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h2
                                                    onClick={() => router.push(`/producto/${item.codigo}`)}
                                                    className="text-xl font-bold text-slate-900 hover:text-primary cursor-pointer transition-colors"
                                                >
                                                    {item.ddetallada}
                                                </h2>
                                                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                                    <span className="material-symbols-outlined text-sm">check_circle</span> {parseFloat(item.stock_disponible || '0')} En Stock
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-sm mb-4 line-clamp-2">Cód: {item.codigo}</p>

                                            <div className="space-y-1">
                                                <p className="text-2xl font-black text-primary">${parseFloat(item.precio_divisa || '0').toFixed(2)} USD</p>
                                                <p className="text-slate-400 text-sm font-medium">Bs {parseFloat(item.precio_local || '0').toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                                            <button
                                                onClick={() => handleAddToCart(item)}
                                                disabled={addingMap[item.codigo]}
                                                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-8 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                <span className={addingMap[item.codigo] ? "material-symbols-outlined animate-spin" : "material-symbols-outlined text-xl"}>
                                                    {addingMap[item.codigo] ? "refresh" : "add_shopping_cart"}
                                                </span>
                                                {addingMap[item.codigo] ? "Añadiendo..." : "Añadir al Carrito"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && results.length === 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center">
                            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No se encontraron productos</h3>
                            <p className="text-slate-500 max-w-md">No hay resultados que coincidan con &quot;{query}&quot;. Intenta verificar la ortografía o usa términos más generales.</p>
                            <button
                                onClick={() => router.push('/')}
                                className="mt-6 text-primary font-bold hover:underline"
                            >
                                Volver al inicio
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function BuscarPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary font-medium">Cargando buscador...</div>}>
            <SearchResultsContent />
        </Suspense>
    );
}
