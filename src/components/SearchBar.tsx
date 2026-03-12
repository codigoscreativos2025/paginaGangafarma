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
                    onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
                />
                <button className="bg-highlight hover:bg-highlight/90 text-white px-8 py-3 rounded-lg font-bold transition-all">
                    Buscar
                </button>
            </div>

            {/* Resultados Desplegables */}
            {showDropdown && (query.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-20 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-slate-500">Buscando productos...</div>
                    ) : results.length > 0 ? (
                        <ul className="divide-y divide-slate-100">
                            {results.map((item) => (
                                <li
                                    key={item.codigo}
                                    onClick={() => router.push(`/producto/${item.codigo}`)}
                                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-primary">{item.ddetallada}</span>
                                        <span className="text-xs text-slate-500">Cód: {item.codigo} | Existencia: {parseFloat(item.stock_disponible || '0')}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-highlight">${parseFloat(item.precio_divisa || '0').toFixed(2)} USD</span>
                                        <span className="text-xs font-medium text-secondary">Bs {parseFloat(item.precio_local || '0').toFixed(2)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-slate-500">No se encontraron resultados para &quot;{query}&quot;</div>
                    )}
                </div>
            )}
        </div>
    );
}
