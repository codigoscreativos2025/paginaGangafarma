'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import { useLoginModal } from '@/components/LoginModalContext';

type Product = {
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
            image: ""
        });
        setAddingMap(prev => ({ ...prev, [product.codigo]: false }));
    };

    return (
        <div className="relative flex min-h-screen flex-col bg-slate-50 pb-28 md:pb-0">
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-primary/10 px-4 md:px-10 py-3">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
                    <Link href="/" className="flex items-center gap-2 text-primary shrink-0">
                        <div className="bg-primary text-white p-2 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl md:text-3xl">medical_services</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight">GangaFarma</h2>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button onClick={openCart} className="relative p-3 hover:bg-primary/10 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-2xl md:text-3xl">shopping_cart</span>
                            {items.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">
                                    {items.length}
                                </span>
                            )}
                        </button>
                        <button onClick={openModal} className="p-3 hover:bg-primary/10 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-2xl md:text-3xl">account_circle</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1440px] mx-auto w-full px-3 md:px-10 py-4 md:py-6">
                <nav className="flex text-base text-slate-500 mb-4 md:mb-6 gap-2 items-center">
                    <Link className="hover:text-primary font-medium" href="/">Inicio</Link>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <span className="font-medium text-slate-900">Resultados</span>
                </nav>

                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">Resultados de búsqueda</h1>
                    <p className="text-base md:text-lg text-slate-500">
                        {loading ? 'Buscando...' : `${results.length} productos encontrados para "${query}"`}
                    </p>
                </div>

                {!loading && results.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 md:gap-6">
                        {results.map((item) => (
                            <div key={item.codigo} className="bg-white rounded-2xl border-2 border-primary/10 p-4 flex flex-col shadow-md hover:shadow-xl transition-shadow">
                                <div
                                    onClick={() => router.push(`/producto/${item.codigo}`)}
                                    className="relative aspect-square rounded-xl bg-slate-50 mb-4 flex items-center justify-center cursor-pointer border border-slate-100"
                                >
                                    <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-4xl md:text-5xl text-primary">medication</span>
                                    </div>
                                    <span className="absolute top-2 left-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full uppercase">
                                        {parseFloat(item.stock_disponible || '0')} disp.
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-tight mb-2">Código: {item.codigo}</p>
                                <h4
                                    onClick={() => router.push(`/producto/${item.codigo}`)}
                                    className="font-bold text-base md:text-lg leading-tight mb-3 cursor-pointer hover:text-primary transition-colors line-clamp-2"
                                >
                                    {item.ddetallada}
                                </h4>
                                <div className="mt-auto">
                                    <div className="bg-primary/5 rounded-xl p-3 mb-3">
                                        <span className="text-price-lg font-black text-primary block">${parseFloat(item.precio_divisa || '0').toFixed(2)}</span>
                                        <p className="text-sm text-slate-500 font-medium">Bs {parseFloat(item.precio_local || '0').toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleAddToCart(item)}
                                        disabled={addingMap[item.codigo]}
                                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-base active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {addingMap[item.codigo] ? 'refresh' : 'add_shopping_cart'}
                                        </span>
                                        {addingMap[item.codigo] ? 'Agregando...' : 'Agregar al Carrito'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && results.length === 0 && (
                    <div className="bg-white rounded-2xl border-2 border-slate-200 p-10 md:p-12 text-center flex flex-col items-center">
                        <span className="material-symbols-outlined text-7xl text-slate-300 mb-4">search_off</span>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No se encontraron productos</h3>
                        <p className="text-lg text-slate-500 max-w-md mb-6">No hay resultados para &quot;{query}&quot;. Intenta con otras palabras.</p>
                        <button onClick={() => router.push('/')} className="bg-primary text-white font-bold py-4 px-8 rounded-xl text-lg hover:bg-primary/90 transition-colors">
                            Volver al inicio
                        </button>
                    </div>
                )}
            </main>

            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t-2 border-primary/10 px-4 pb-8 pt-3 backdrop-blur-lg">
                <div className="flex justify-between items-center max-w-lg mx-auto">
                    <Link href="/" className="flex flex-col items-center gap-1 text-slate-500">
                        <span className="material-symbols-outlined text-3xl">home</span>
                        <span className="text-xs font-bold">Inicio</span>
                    </Link>
                    <Link href="/buscar?q=" className="flex flex-col items-center gap-1 text-primary">
                        <span className="material-symbols-outlined text-3xl">search</span>
                        <span className="text-xs font-bold">Buscar</span>
                    </Link>
                    <div className="relative -top-5">
                        <button onClick={openCart} className="bg-primary text-white size-16 rounded-full shadow-xl shadow-primary/40 flex items-center justify-center border-4 border-white">
                            <span className="material-symbols-outlined text-4xl">shopping_cart</span>
                            {items.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">
                                    {items.length}
                                </span>
                            )}
                        </button>
                    </div>
                    <Link href="/dashboard/admin" className="flex flex-col items-center gap-1 text-slate-500">
                        <span className="material-symbols-outlined text-3xl">dashboard</span>
                        <span className="text-xs font-medium">Admin</span>
                    </Link>
                    <button onClick={openModal} className="flex flex-col items-center gap-1 text-slate-500">
                        <span className="material-symbols-outlined text-3xl">person</span>
                        <span className="text-xs font-medium">Perfil</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}

export default function BuscarPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-primary animate-spin">refresh</span>
                    <p className="mt-4 text-xl font-medium text-slate-600">Cargando buscador...</p>
                </div>
            </div>
        }>
            <SearchResultsContent />
        </Suspense>
    );
}
