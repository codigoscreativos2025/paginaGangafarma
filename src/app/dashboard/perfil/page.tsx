'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Order = {
    id: string;
    items: string;
    total: number;
    status: { name: string; color: string } | null;
    deliveryType: string;
    paymentMethod: string | null;
    createdAt: string;
};

type Address = {
    id: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    isDefault: boolean;
};

type UserData = {
    id: string;
    name: string | null;
    cedula: string;
    telefono: string | null;
    role: string;
    createdAt: string;
    addresses: Address[];
};

export default function PerfilPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    
    const [userData, setUserData] = useState<UserData | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');
    const [telefono, setTelefono] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', zip: '', isDefault: false });
    const [savingAddress, setSavingAddress] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchProfile();
        }
    }, [session]);

    const fetchProfile = async () => {
        try {
            const [profileRes, ordersRes] = await Promise.all([
                fetch('/api/profile'),
                fetch('/api/order')
            ]);
            const profileData = await profileRes.json();
            const ordersData = await ordersRes.json();
            
            if (profileData.user) {
                setUserData(profileData.user);
                setName(profileData.user.name || '');
                setTelefono(profileData.user.telefono || '');
            }
            if (ordersData.orders) {
                setOrders(ordersData.orders);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg({ type: '', text: '' });
        
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, telefono })
            });
            
            if (res.ok) {
                setMsg({ type: 'success', text: 'Perfil actualizado correctamente' });
                setEditing(false);
                update();
            } else {
                setMsg({ type: 'error', text: 'Error al actualizar perfil' });
            }
        } catch {
            setMsg({ type: 'error', text: 'Error al actualizar perfil' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddAddress = async () => {
        if (!newAddress.street || !newAddress.city || !newAddress.state) {
            setMsg({ type: 'error', text: 'Completa los campos requeridos' });
            return;
        }
        setSavingAddress(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAddress)
            });
            if (res.ok) {
                setMsg({ type: 'success', text: 'Dirección agregada' });
                setShowAddressForm(false);
                setNewAddress({ street: '', city: '', state: '', zip: '', isDefault: false });
                fetchProfile();
            } else {
                setMsg({ type: 'error', text: 'Error al agregar dirección' });
            }
        } catch {
            setMsg({ type: 'error', text: 'Error al agregar dirección' });
        } finally {
            setSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm('¿Eliminar esta dirección?')) return;
        try {
            await fetch(`/api/profile?id=${id}`, { method: 'DELETE' });
            fetchProfile();
        } catch (e) {
            console.error(e);
        }
    };

    const getStatusColor = (status: { name: string; color: string } | null) => {
        if (!status) return 'bg-gray-100 text-gray-700';
        return { backgroundColor: status.color };
    };

    const getStatusText = (status: { name: string } | null) => {
        if (!status) return 'Sin estado';
        return status.name;
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-primary animate-spin">refresh</span>
                    <p className="mt-4 text-xl font-medium text-slate-600">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
            <header className="bg-white border-b border-slate-200 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-primary">
                            <span className="material-symbols-outlined text-3xl">arrow_back</span>
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-800">Mi Perfil</h1>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="text-red-600 font-medium flex items-center gap-1 hover:text-red-700"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                <section className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Datos Personales</h2>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="text-primary font-medium flex items-center gap-1 hover:underline"
                            >
                                <span className="material-symbols-outlined">edit</span>
                                Editar
                            </button>
                        )}
                    </div>

                    {msg.text && (
                        <div className={`p-4 rounded-xl mb-4 text-center font-medium ${
                            msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                            {msg.text}
                        </div>
                    )}

                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Tu nombre completo"
                                />
                            ) : (
                                <p className="text-lg font-medium text-slate-800">{userData?.name || 'No registrado'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Cédula</label>
                            <p className="text-lg font-medium text-slate-800">{userData?.cedula}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Teléfono</label>
                            {editing ? (
                                <input
                                    type="tel"
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="04121234567"
                                />
                            ) : (
                                <p className="text-lg font-medium text-slate-800">{userData?.telefono || 'No registrado'}</p>
                            )}
                        </div>

                        {editing && (
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setName(userData?.name || '');
                                        setTelefono(userData?.telefono || '');
                                    }}
                                    className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Mis Direcciones</h2>
                        <button
                            onClick={() => setShowAddressForm(!showAddressForm)}
                            className="text-primary font-medium flex items-center gap-1 hover:underline"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Agregar
                        </button>
                    </div>

                    {showAddressForm && (
                        <div className="bg-slate-50 p-4 rounded-xl mb-4 space-y-3">
                            <input
                                type="text"
                                placeholder="Dirección (calle, número, edificio)"
                                value={newAddress.street}
                                onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Ciudad"
                                    value={newAddress.city}
                                    onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                                />
                                <input
                                    type="text"
                                    placeholder="Estado"
                                    value={newAddress.state}
                                    onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Código postal (opcional)"
                                value={newAddress.zip}
                                onChange={(e) => setNewAddress({...newAddress, zip: e.target.value})}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                            />
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={newAddress.isDefault}
                                    onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                                />
                                <span className="text-sm text-slate-600">Dirección principal</span>
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowAddressForm(false)}
                                    className="flex-1 py-2 border border-slate-200 rounded-lg font-medium text-slate-600"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddAddress}
                                    disabled={savingAddress}
                                    className="flex-1 bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {savingAddress ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {userData?.addresses && userData.addresses.length > 0 ? (
                        <div className="space-y-3">
                            {userData.addresses.map((addr) => (
                                <div key={addr.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-slate-800">{addr.street}</p>
                                        <p className="text-sm text-slate-500">{addr.city}, {addr.state} {addr.zip}</p>
                                        {addr.isDefault && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                Principal
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteAddress(addr.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-4">No hay direcciones guardadas</p>
                    )}
                </section>

                    <section className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Mis Pedidos</h2>
                    
                    {orders.length === 0 ? (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-6xl text-slate-300">receipt_long</span>
                            <p className="mt-4 text-lg text-slate-500">No tienes pedidos realizados</p>
                            <Link href="/" className="mt-4 inline-block text-primary font-bold hover:underline">
                                Empezar a comprar
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => {
                                let itemsList: string[] = [];
                                try {
                                    itemsList = JSON.parse(order.items).map((i: { ddetallada?: string; codigo?: string }) => i.ddetallada || i.codigo || 'Producto');
                                } catch {
                                    itemsList = ['Producto'];
                                }
                                const displayItems = itemsList.slice(0, 3);
                                const hasMore = itemsList.length > 3;
                                
                                return (
                                    <div key={order.id} className="border border-slate-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="font-bold text-slate-800">Pedido #{order.id.slice(-8)}</p>
                                                <p className="text-sm text-slate-500">
                                                    {new Date(order.createdAt).toLocaleDateString('es-VE', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </div>
                                        <div className="mb-3">
                                            <p className="text-sm text-slate-600 font-medium">Productos:</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {displayItems.map((item, idx) => (
                                                    <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                        {item}
                                                    </span>
                                                ))}
                                                {hasMore && (
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                                        +{itemsList.length - 3} más
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-slate-600">
                                                    {order.deliveryType === 'delivery' ? '📦 Delivery' : '🏪 Retiro en tienda'}
                                                </p>
                                                {order.paymentMethod && (
                                                    <p className="text-sm text-slate-500">Pago: {order.paymentMethod}</p>
                                                )}
                                            </div>
                                            <p className="text-xl font-black text-primary">${order.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
