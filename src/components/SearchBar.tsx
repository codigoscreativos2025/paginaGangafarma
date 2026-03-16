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
    const [isFocused, setIsFocused] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
                    if (data.results?.length > 0) {
                        setShowDropdown(true);
                    }
                }
            } catch (error) {
                console.error("Error buscando productos:", error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounceId);
    }, [query]);

    const handleSearch = () => {
        if (query.trim() !== '') {
            setShowDropdown(false);
            router.push(`/buscar?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <div className="relative max-w-2xl w-full" ref={dropdownRef}>
            <div className="flex flex-col gap-3">
                <div className={`flex items-center bg-white rounded-xl overflow-hidden shadow-lg border-2 transition-all duration-300 ${
                    isFocused ? 'border-primary ring-4 ring-primary/20' : 'border-slate-200'
                }`}>
                    <div className="flex items-center justify-center px-4 text-primary">
                        <span className="material-symbols-outlined text-3xl">search</span>
                    </div>
                    <input
                        className="w-full border-none outline-none focus:ring-0 text-slate-900 placeholder:text-slate-400 py-4 text-xl font-medium"
                        placeholder="Busca por nombre o síntoma (Ej. Amoxicilina)"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                        onFocus={() => { 
                            setIsFocused(true); 
                            if (results.length > 0) setShowDropdown(true); 
                        }}
                        onBlur={() => setIsFocused(false)}
                    />
                </div>

                <button
                    onClick={handleSearch}
                    disabled={!query.trim() || loading}
                    className={`w-full h-14 bg-highlight hover:bg-highlight/90 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-lg ${
                        !query.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] animate-pulse hover:animate-none'
                    }`}
                >
                    {loading ? (
                        <>
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                            Buscando...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-2xl">search</span>
                            Buscar Medicamentos
                        </>
                    )}
                </button>
            </div>

            {showDropdown && query.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-20">
                    <div className="p-2">
                        {loading ? (
                            <div className="p-6 text-center">
                                <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
                                <p className="mt-2 text-lg text-slate-500 font-medium">Buscando productos...</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="flex gap-4 overflow-x-auto p-4 snap-x hide-scroll-bar max-h-80">
                                {results.slice(0, 6).map((item) => (
                                    <div
                                        key={item.codigo}
                                        onClick={() => {
                                            setShowDropdown(false);
                                            router.push(`/producto/${item.codigo}`);
                                        }}
                                        className="snap-start shrink-0 min-w-[260px] max-w-[280px] flex flex-col justify-between p-5 rounded-2xl bg-white border-2 border-slate-100 hover:border-primary hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                                    >
                                        <div className="flex flex-col mb-3">
                                            <span className="font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors text-lg" title={item.ddetallada}>{item.ddetallada}</span>
                                            <span className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest bg-slate-50 w-max px-2 py-1 rounded">Cód: {item.codigo}</span>
                                        </div>
                                        <div className="flex flex-col items-start mt-auto">
                                            <span className="font-black text-primary text-2xl">${parseFloat(item.precio_divisa || '0').toFixed(2)}</span>
                                            <span className="text-sm font-semibold text-slate-400">Bs {parseFloat(item.precio_local || '0').toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center">
                                <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                                <p className="mt-2 text-lg text-slate-500 font-medium">No se encontraron resultados para &quot;{query}&quot;</p>
                            </div>
                        )}
                    </div>
                    {results.length > 0 && (
                        <div className="border-t border-slate-100 p-3 bg-slate-50">
                            <button
                                onClick={handleSearch}
                                className="w-full text-center text-primary font-bold text-lg hover:underline py-2"
                            >
                                Ver todos los {results.length} resultados →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
