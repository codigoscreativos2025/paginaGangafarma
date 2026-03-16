'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartContext';
import { useLoginModal } from '@/components/LoginModalContext';

type Product = {
    codigo: string;
    ddetallada: string;
    stock_disponible: string;
    precio_local: string;
    precio_divisa: string;
    override?: {
        description?: string;
        howToUse?: string;
        warnings?: string;
        imageUrl?: string;
    };
};

export default function ProductDetailPage({ params }: { params: { id: string } }) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    const { openCart, items, addToCart } = useCart();
    const { openModal } = useLoginModal();
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetch(`/api/product?id=${params.id}`)
            .then(res => res.json())
            .then(data => {
                const prod = data.product;
                setProduct(prod);
                setLoading(false);

                if (prod) {
                    fetch('/api/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ codigo: prod.codigo, actionType: 'VIEW' })
                    }).catch(console.error);
                }
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-5xl animate-spin">refresh</span>
                    <p className="text-lg font-medium text-slate-600">Cargando producto...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Producto no encontrado</h2>
                <p className="text-slate-500 mb-6">No pudimos encontrar este producto.</p>
                <Link href="/" className="bg-primary text-white font-bold py-3 px-8 rounded-2xl">Volver al inicio</Link>
            </div>
        );
    }

    const stock = parseFloat(product.stock_disponible || '0');
    const priceUSD = parseFloat(product.precio_divisa || '0');
    const customImg = product.override?.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-slate-50 pb-24 md:pb-0">
            {/* Navigation Bar */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-primary/10 px-4 md:px-10 py-3">
                <div className="flex items-center justify-between max-w-[1200px] mx-auto">
                    <div className="flex items-center gap-4 md:gap-8">
                        <Link href="/" className="flex items-center gap-2 text-primary">
                            <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">medical_services</span>
                            </div>
                            <h2 className="text-lg md:text-xl font-bold tracking-tight">GangaFarma</h2>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={openCart} className="relative p-2.5 hover:bg-primary/10 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                            {items.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                                    {items.length}
                                </span>
                            )}
                        </button>
                        <button onClick={openModal} className="p-2.5 hover:bg-primary/10 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-2xl">account_circle</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 justify-center py-4 md:py-10">
                <div className="flex flex-col max-w-[1200px] flex-1 px-4 md:px-10">
                    <nav className="flex flex-wrap gap-2 pb-4 md:pb-6">
                        <Link className="text-primary text-sm font-medium hover:underline" href="/">Inicio</Link>
                        <span className="text-primary/40 text-sm">/</span>
                        <span className="text-slate-500 text-sm font-medium">Producto ({product.codigo})</span>
                    </nav>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-start">
                        {/* Image */}
                        <div className="aspect-square w-full bg-white rounded-2xl overflow-hidden border border-primary/10 flex items-center justify-center relative shadow-sm">
                            <Image className="object-cover p-2 rounded-2xl" fill sizes="(max-width: 768px) 100vw, 50vw" alt={product.ddetallada} src={customImg} />
                            {stock <= 0 && <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-xl">Agotado</div>}
                        </div>

                        {/* Product Info */}
                        <div className="flex flex-col gap-4 md:gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-primary font-semibold text-xs uppercase tracking-wider bg-primary/10 px-2 py-1 rounded">CÓDIGO: {product.codigo}</span>
                                </div>
                                <h1 className="text-slate-900 text-2xl md:text-4xl font-black leading-tight tracking-tight">{product.ddetallada}</h1>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined text-2xl ${stock > 0 ? 'text-primary' : 'text-red-500'}`}>{stock > 0 ? 'check_circle' : 'cancel'}</span>
                                <span className={`${stock > 0 ? 'text-primary' : 'text-red-500'} font-bold text-base`}>
                                    {stock > 0 ? `En Stock (${stock} disp.)` : 'Sin Existencia'}
                                </span>
                            </div>

                            <div className="p-5 bg-white rounded-2xl border border-primary/10 shadow-sm">
                                <p className="text-slate-500 text-xs font-medium uppercase mb-1">Precio (Ref)</p>
                                <p className="text-primary tracking-tight text-4xl md:text-3xl font-black">${priceUSD.toFixed(2)}</p>
                            </div>

                            <button
                                onClick={async () => {
                                    setAdding(true);
                                    await addToCart({
                                        codigo: product.codigo,
                                        ddetallada: product.ddetallada,
                                        price: priceUSD,
                                        quantity: 1,
                                        image: customImg
                                    });
                                    setAdding(false);
                                }}
                                disabled={stock <= 0 || adding}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-lg active:scale-[0.98]"
                            >
                                <span className={adding ? "material-symbols-outlined animate-spin text-2xl" : "material-symbols-outlined text-2xl"}>
                                    {adding ? "refresh" : "add_shopping_cart"}
                                </span>
                                {adding ? "Añadiendo..." : "Añadir al Carrito"}
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mt-8 md:mt-12 space-y-6">
                        <div className="border-b border-primary/10 pb-4">
                            <button className="text-primary font-bold border-b-2 border-primary text-sm uppercase tracking-wider">Descripción</button>
                        </div>
                        <div className="bg-white p-5 md:p-8 rounded-2xl border border-primary/10">
                            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3">Sobre este producto</h3>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base">
                                {product.override?.description || "Sin descripción adicional. Consulte al farmacéutico."}
                            </p>
                        </div>

                        {product.override?.howToUse && (
                            <div className="bg-white p-5 md:p-8 rounded-2xl border border-primary/10">
                                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">schedule</span>
                                    Cómo usar
                                </h3>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base">{product.override.howToUse}</p>
                            </div>
                        )}

                        {product.override?.warnings && (
                            <div className="bg-red-50 p-5 md:p-8 rounded-2xl border border-red-200">
                                <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined">warning</span>
                                    Advertencias
                                </h3>
                                <p className="text-sm text-red-700 whitespace-pre-wrap">{product.override.warnings}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile bottom bar with add to cart */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-4">
                <div className="flex-1">
                    <p className="text-xs text-slate-500">Precio</p>
                    <p className="text-xl font-black text-primary">${priceUSD.toFixed(2)}</p>
                </div>
                <button
                    onClick={async () => {
                        setAdding(true);
                        await addToCart({
                            codigo: product.codigo,
                            ddetallada: product.ddetallada,
                            price: priceUSD,
                            quantity: 1,
                            image: customImg
                        });
                        setAdding(false);
                    }}
                    disabled={stock <= 0 || adding}
                    className="bg-primary text-white font-bold py-4 px-8 rounded-2xl text-base flex items-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined">add_shopping_cart</span>
                    {adding ? "..." : "Añadir"}
                </button>
            </div>
        </div>
    );
}
