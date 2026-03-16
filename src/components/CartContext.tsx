"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLoginModal } from "./LoginModalContext";
import Image from "next/image";

type CartItemType = {
    id: string;
    codigo: string;
    ddetallada: string;
    price: number;
    quantity: number;
    image?: string;
};

type DeliveryType = 'pickup' | 'delivery';

type CartContextType = {
    items: CartItemType[];
    isCartOpen: boolean;
    deliveryType: DeliveryType;
    deliveryMinAmount: number;
    openCart: () => void;
    closeCart: () => void;
    setDeliveryType: (type: DeliveryType) => void;
    addToCart: (item: Omit<CartItemType, "id">) => void;
    removeFromCart: (codigo: string) => void;
    updateQuantity: (codigo: string, quantity: number) => void;
    cartTotal: number;
    canProceedToCheckout: () => { allowed: boolean; message: string };
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart debe ser usado dentro de CartProvider");
    return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItemType[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
    const [deliveryMinAmount, setDeliveryMinAmount] = useState<number>(5.0);
    const { status } = useSession();
    const { openModal } = useLoginModal();

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                if (data.config?.deliveryMinAmount) {
                    setDeliveryMinAmount(data.config.deliveryMinAmount);
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/cart")
                .then(res => res.json())
                .then(data => {
                    if (data.items) {
                        setItems(data.items);
                    }
                })
                .catch(console.error);
        } else {
            setItems([]);
        }
    }, [status]);

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    const canProceedToCheckout = () => {
        if (items.length === 0) {
            return { allowed: false, message: 'Tu carrito está vacío' };
        }
        if (deliveryType === 'delivery' && cartTotal < deliveryMinAmount) {
            return { 
                allowed: false, 
                message: `El monto mínimo para delivery es $${deliveryMinAmount.toFixed(2)}. Añade más productos.` 
            };
        }
        return { allowed: true, message: '' };
    };

    const addToCart = async (item: Omit<CartItemType, "id">) => {
        if (status !== "authenticated") {
            openModal();
            return;
        }

        try {
            const resp = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ codigo: item.codigo, quantity: item.quantity })
            });
            const data = await resp.json();
            if (resp.ok && data.item) {
                setItems(prev => {
                    const existing = prev.find(i => i.codigo === item.codigo);
                    if (existing) {
                        return prev.map(i => i.codigo === item.codigo ? { ...i, quantity: i.quantity + item.quantity } : i);
                    }
                    return [...prev, { ...item, id: data.item.id }];
                });
                openCart();
            }
        } catch (error) {
            console.error("Error added to cart", error);
        }
    };

    const removeFromCart = async (codigo: string) => {
        if (status !== "authenticated") return;
        try {
            await fetch(`/api/cart?codigo=${codigo}`, { method: "DELETE" });
            setItems(prev => prev.filter(i => i.codigo !== codigo));
        } catch (e) {
            console.error(e);
        }
    };

    const updateQuantity = async (codigo: string, quantity: number) => {
        if (status !== "authenticated") return;
        if (quantity <= 0) return removeFromCart(codigo);

        try {
            await fetch("/api/cart", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ codigo, quantity })
            });
            setItems(prev => prev.map(i => i.codigo === codigo ? { ...i, quantity } : i));
        } catch (e) {
            console.error(e);
        }
    };

    const cartTotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ 
            items, 
            isCartOpen, 
            deliveryType, 
            deliveryMinAmount,
            openCart, 
            closeCart, 
            setDeliveryType,
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            cartTotal,
            canProceedToCheckout
        }}>
            {children}
            {isCartOpen && <CartDrawer />}
        </CartContext.Provider>
    );
}

function CartDrawer() {
    const { isCartOpen, closeCart, items, removeFromCart, updateQuantity, cartTotal, deliveryType, setDeliveryType, deliveryMinAmount, canProceedToCheckout } = useCart();
    const [checkoutError, setCheckoutError] = useState('');

    const handleCheckout = () => {
        const result = canProceedToCheckout();
        if (!result.allowed) {
            setCheckoutError(result.message);
            return;
        }
        setCheckoutError('');
        alert(`Procediendo al pago - ${deliveryType === 'delivery' ? 'Delivery' : 'Retiro en tienda'}`);
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={closeCart}
            />
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col transition-transform duration-300 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">shopping_cart</span>
                        Mi Carrito
                    </h2>
                    <button onClick={closeCart} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 h-8 w-8 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-70">
                            <span className="material-symbols-outlined text-6xl mb-4">remove_shopping_cart</span>
                            <p>Tu carrito está vacío</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.codigo} className="flex gap-4 border-b border-slate-100 pb-4">
                                <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative shrink-0">
                                    {item.image ? (
                                        <Image src={item.image} alt={item.ddetallada} fill className="object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300 text-3xl">medication</span>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">{item.ddetallada}</h4>
                                        <p className="text-primary font-black mt-1">${item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                                            <button onClick={() => updateQuantity(item.codigo, item.quantity - 1)} className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined text-sm">remove</span></button>
                                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.codigo, item.quantity + 1)} className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined text-sm">add</span></button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.codigo)} className="text-red-400 hover:text-red-600 text-xs font-bold underline">Eliminar</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                            <p className="text-sm font-bold text-slate-700 mb-3">¿Cómo quieres recibir tu pedido?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDeliveryType('pickup')}
                                    className={`flex-1 py-3 px-2 rounded-lg font-medium text-sm flex flex-col items-center gap-1 transition-all ${
                                        deliveryType === 'pickup' 
                                            ? 'bg-green-100 border-2 border-green-500 text-green-700' 
                                            : 'bg-slate-100 border-2 border-transparent text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    <span className="material-symbols-outlined">storefront</span>
                                    Retiro en Tienda
                                </button>
                                <button
                                    onClick={() => {
                                        setDeliveryType('delivery');
                                        setCheckoutError('');
                                    }}
                                    className={`flex-1 py-3 px-2 rounded-lg font-medium text-sm flex flex-col items-center gap-1 transition-all ${
                                        deliveryType === 'delivery' 
                                            ? 'bg-blue-100 border-2 border-blue-500 text-blue-700' 
                                            : 'bg-slate-100 border-2 border-transparent text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    <span className="material-symbols-outlined">local_shipping</span>
                                    Delivery
                                </button>
                            </div>
                            {deliveryType === 'delivery' && (
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-amber-500">info</span>
                                    Monto mínimo: ${deliveryMinAmount.toFixed(2)}
                                </p>
                            )}
                        </div>

                        {checkoutError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center animate-shake">
                                {checkoutError}
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Total Estimado</span>
                            <span className="text-2xl font-black text-slate-900">${cartTotal.toFixed(2)}</span>
                        </div>
                        <button 
                            onClick={handleCheckout}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">lock</span>
                            Proceder al Pago
                        </button>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </>
    );
}
