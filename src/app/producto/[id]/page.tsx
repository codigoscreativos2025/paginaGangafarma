'use client';

import { useEffect, useState } from 'react';
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
    fv: string;
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

                // Log view analytics
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
        return <div className="min-h-screen flex items-center justify-center">Cargando producto...</div>;
    }

    if (!product) {
        return <div className="min-h-screen flex items-center justify-center">Producto no encontrado</div>;
    }

    const stock = parseFloat(product.stock_disponible || '0');
    const priceUSD = parseFloat(product.precio_divisa || '0');
    const priceLocal = parseFloat(product.precio_local || '0');
    const customImg = product.override?.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';

    return (
        <div className="relative flex min-h-screen w-full flex-col group/design-root overflow-x-hidden">
            {/* Navigation Bar */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 bg-white px-4 md:px-10 py-3 sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-4 text-primary">
                        <div className="size-6 flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">medical_services</span>
                        </div>
                        <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-[-0.015em]">GangaFarma</h2>
                    </Link>
                    <div className="hidden lg:flex items-center gap-9">
                        <a className="text-slate-700 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Medicinas</a>
                        <a className="text-slate-700 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Bienestar</a>
                        <a className="text-slate-700 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Belleza</a>
                        <a className="text-slate-700 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Ofertas</a>
                    </div>
                </div>
                <div className="flex flex-1 justify-end gap-4 md:gap-8">
                    <div className="flex gap-2 relative">
                        <button onClick={openCart} className="relative flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20 transition-all">
                            <span className="material-symbols-outlined">shopping_cart</span>
                            {items.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                    {items.length}
                                </span>
                            )}
                        </button>
                        <button onClick={openModal} className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20 transition-all">
                            <span className="material-symbols-outlined">person</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 justify-center py-6 md:py-10">
                <div className="layout-content-container flex flex-col max-w-[1200px] flex-1 px-4 md:px-10">
                    <nav className="flex flex-wrap gap-2 pb-6">
                        <Link className="text-primary text-sm font-medium leading-normal hover:underline" href="/">Inicio</Link>
                        <span className="text-primary/40 text-sm font-medium leading-normal">/</span>
                        <span className="text-slate-500 text-sm font-medium leading-normal">Producto ({product.codigo})</span>
                    </nav>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
                        <div className="space-y-4">
                            <div className="aspect-square w-full bg-white rounded-xl overflow-hidden border border-primary/10 flex items-center justify-center relative">
                                <Image className="object-cover p-2 rounded-xl" fill sizes="(max-width: 768px) 100vw, 50vw" alt={product.ddetallada} src={customImg} />
                                {stock <= 0 && <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">Agotado</div>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-primary font-semibold text-xs uppercase tracking-wider">CÓDIGO: {product.codigo}</span>
                                </div>
                                <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight">{product.ddetallada}</h1>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined ${stock > 0 ? 'text-primary' : 'text-red-500'}`}>{stock > 0 ? 'check_circle' : 'cancel'}</span>
                                <span className={`${stock > 0 ? 'text-primary' : 'text-red-500'} font-bold text-sm`}>
                                    {stock > 0 ? `En Stock (${stock} disp.)` : 'Sin Existencia'}
                                </span>
                                {product.fv && <span className="text-xs text-slate-500 ml-2">Vence: {new Date(product.fv).toLocaleDateString()}</span>}
                            </div>

                            <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl border border-primary/10 shadow-sm">
                                <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                                    <p className="text-slate-500 text-xs font-medium uppercase">Precio (Ref)</p>
                                    <p className="text-primary tracking-tight text-3xl font-black">${priceUSD.toFixed(2)}</p>
                                </div>
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
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <span className={adding ? "material-symbols-outlined animate-spin" : "material-symbols-outlined"}>
                                    {adding ? "refresh" : "add_shopping_cart"}
                                </span>
                                {adding ? "Añadiendo..." : "Añadir al Carrito"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 space-y-8">
                        <div className="border-b border-primary/10 flex gap-8">
                            <button className="pb-4 text-primary font-bold border-b-2 border-primary text-sm uppercase tracking-wider">Descripción</button>
                        </div>

                        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-xl font-bold text-slate-900">Sobre este medicamento / producto</h3>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {product.override?.description || "Sin descripción adicional. Consulte al farmacéutico."}
                                </p>
                            </div>
                        </section>

                        {product.override?.howToUse && (
                            <section className="pt-6 border-t border-primary/5">
                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">schedule</span>
                                    Cómo usar
                                </h3>
                                <div className="bg-white p-6 rounded-xl border border-primary/10">
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{product.override.howToUse}</p>
                                </div>
                            </section>
                        )}

                        {product.override?.warnings && (
                            <section className="pt-6 border-t border-primary/5">
                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2 text-red-600">
                                    <span className="material-symbols-outlined">warning</span>
                                    Advertencias & Precauciones
                                </h3>
                                <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                                    <p className="text-sm text-red-700 whitespace-pre-wrap">{product.override.warnings}</p>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
