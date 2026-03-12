'use client';

import { useState, useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

type Product = {
    codigo: string;
    ddetallada: string;
    stock_disponible: string;
    precio_local: string;
    precio_divisa: string;
};

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Cierra el dropdown si se hace click afuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Función de Debounce para búsqueda (300ms)
    useEffect(() => {
        if (!query) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const debounceId = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.results || []);
                    setShowDropdown(true);
                }
            } catch (error) {
                console.error("Error buscando productos:", error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounceId);
    }, [query]);

    return (
        <div className="relative max-w-2xl w-full" ref={dropdownRef}>
            <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-lg p-1.5 border border-slate-200 focus-within:border-primary transition-colors">
                <div className="flex items-center justify-center px-4 text-primary">
                    <span className="material-symbols-outlined text-2xl">search</span>
                </div>
                <input
                    className="w-full border-none outline-none focus:ring-0 text-slate-900 placeholder:text-slate-400 py-3 text-lg"
                    placeholder="Busca por nombre o síntoma (Ej. Amoxicilina)"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && query.trim() !== '') {
                            setShowDropdown(false);
                            router.push(`/buscar?q=${encodeURIComponent(query)}`);
                        }
                    }}
                    onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
                />
                <button
                    onClick={() => {
                        if (query.trim() !== '') {
                            setShowDropdown(false);
                            router.push(`/buscar?q=${encodeURIComponent(query)}`);
                        }
                    }}
                    className="bg-highlight hover:bg-highlight/90 text-white px-8 py-3 rounded-lg font-bold transition-all">
                    Buscar
                </button>
            </div>

            {/* Resultados Desplegables en Formato Carrusel */}
            {showDropdown && (query.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-20 p-2">
                    {loading ? (
                        <div className="p-4 text-center text-slate-500 font-medium">Buscando productos...</div>
                    ) : results.length > 0 ? (
                        <div className="flex gap-4 overflow-x-auto p-4 snap-x hide-scroll-bar">
                            {results.map((item) => (
                                <div
                                    key={item.codigo}
                                    onClick={() => router.push(`/producto/${item.codigo}`)}
                                    className="snap-start shrink-0 min-w-[220px] max-w-[240px] flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-100 hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
                                >
                                    <div className="flex flex-col mb-4">
                                        <span className="font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors" title={item.ddetallada}>{item.ddetallada}</span>
                                        <span className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest bg-slate-50 w-max px-2 py-1 rounded">Cód: {item.codigo}</span>
                                    </div>
                                    <div className="flex flex-col items-start mt-auto">
                                        <span className="font-black text-primary text-xl">${parseFloat(item.precio_divisa || '0').toFixed(2)}</span>
                                        <span className="text-xs font-semibold text-slate-400">Bs {parseFloat(item.precio_local || '0').toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-slate-500 font-medium">No se encontraron resultados para &quot;{query}&quot;</div>
                    )}
                </div>
            )}
        </div>
    );
}
