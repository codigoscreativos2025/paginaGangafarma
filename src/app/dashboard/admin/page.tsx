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

type AnalyticsLogInfo = {
    id: string;
    actionType: string;
    codigo: string;
    ddetallada: string;
    timestamp: Date;
    userType: string;
};

type UserInfoRow = {
    id: string;
    name: string | null;
    cedula: string;
    telefono: string | null;
    role: string;
    cartItemCount: number;
    actionCount: number;
    createdAt: Date;
};

export default function AdminDashboard() {
    const { data: session, status } = useSession();

    const [activeTab, setActiveTab] = useState<'productos' | 'analiticas' | 'ofertas' | 'usuarios' | 'configuracion'>('productos');
    const [codigo, setCodigo] = useState('');
    const [productData, setProductData] = useState<ProductDetail | null>(null);

    const [analyticsData, setAnalyticsData] = useState<AnalyticsLogInfo[]>([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const [usersData, setUsersData] = useState<UserInfoRow[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [desc, setDesc] = useState('');
    const [howToUse, setHowToUse] = useState('');
    const [warnings, setWarnings] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [deliveryMinAmount, setDeliveryMinAmount] = useState<number>(5.0);
    const [loadingConfig, setLoadingConfig] = useState(false);

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
                const identifier = data.results[0].codigo;
                // Pedimos los datos completos (que incluyen el Override)
                const fullRes = await fetch(`/api/product?id=${identifier}`);
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

    const loadAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const res = await fetch('/api/admin/analytics');
            const data = await res.json();
            if (data.logs) {
                setAnalyticsData(data.logs);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.users) {
                setUsersData(data.users);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadConfig = async () => {
        setLoadingConfig(true);
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            if (data.config?.deliveryMinAmount) {
                setDeliveryMinAmount(data.config.deliveryMinAmount);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingConfig(false);
        }
    };

    const saveConfig = async () => {
        setLoadingConfig(true);
        try {
            const res = await fetch('/api/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryMinAmount })
            });
            if (res.ok) {
                setMsg({ text: 'Configuración guardada exitosamente!', type: 'success' });
            } else {
                setMsg({ text: 'Error al guardar configuración', type: 'error' });
            }
        } catch {
            setMsg({ text: 'Error al guardar configuración', type: 'error' });
        } finally {
            setLoadingConfig(false);
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
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
                    <button onClick={() => setActiveTab('productos')} className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'productos' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}`}>
                        <span className="material-symbols-outlined">inventory_2</span>
                        Productos
                    </button>
                    <button onClick={() => { setActiveTab('analiticas'); loadAnalytics(); }} className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'analiticas' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}`}>
                        <span className="material-symbols-outlined">insights</span>
                        Analíticas
                    </button>
                    <button onClick={() => { setActiveTab('usuarios'); loadUsers(); }} className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'usuarios' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}`}>
                        <span className="material-symbols-outlined">group</span>
                        Usuarios
                    </button>
                    <button onClick={() => setActiveTab('ofertas')} className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'ofertas' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}`}>
                        <span className="material-symbols-outlined">campaign</span>
                        Promo y Ofertas
                    </button>
                    <button onClick={() => { setActiveTab('configuracion'); loadConfig(); }} className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'configuracion' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}`}>
                        <span className="material-symbols-outlined">settings</span>
                        Configuración
                    </button>
                    <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-3 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium w-full text-left transition-colors">
                        <span className="material-symbols-outlined">logout</span>
                        Cerrar Sesión
                    </button>
                </nav>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <div className="max-w-4xl mx-auto">
                    {activeTab === 'productos' && (
                        <>
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
                        </>
                    )}

                    {activeTab === 'analiticas' && (
                        <>
                            <h1 className="text-3xl font-bold text-slate-800 mb-8">Analíticas Recientes</h1>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                {loadingAnalytics ? (
                                    <p className="p-8 text-slate-500 text-center animate-pulse">Cargando métricas de clientes...</p>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="p-4 text-sm font-bold text-slate-600">Acción</th>
                                                <th className="p-4 text-sm font-bold text-slate-600">Producto</th>
                                                <th className="p-4 text-sm font-bold text-slate-600">Fecha y Hora</th>
                                                <th className="p-4 text-sm font-bold text-slate-600">Usuario</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analyticsData.map((log) => (
                                                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${log.actionType === 'ADD_TO_CART' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            <span className="material-symbols-outlined text-[14px]">
                                                                {log.actionType === 'ADD_TO_CART' ? 'add_shopping_cart' : 'visibility'}
                                                            </span>
                                                            {log.actionType === 'ADD_TO_CART' ? 'Carrito' : 'Visita'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-sm font-semibold text-slate-800">{log.ddetallada}</p>
                                                        <p className="text-xs text-slate-500">Cod: {log.codigo}</p>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600">
                                                        {log.userType}
                                                    </td>
                                                </tr>
                                            ))}
                                            {analyticsData.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-500">No hay interacciones registradas aún.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'ofertas' && (
                        <>
                            <h1 className="text-3xl font-bold text-slate-800 mb-8">Administración de Ofertas</h1>
                            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-6 rounded-xl text-center">
                                <span className="material-symbols-outlined text-4xl mb-2 text-blue-500">campaign</span>
                                <h3 className="text-lg font-bold mb-2">Módulo de Ofertas en Construcción</h3>
                                <p className="text-sm">En próximas iteraciones podrás automatizar los carruseles de la página principal agregando ofertas especiales desde este panel.</p>
                            </div>
                        </>
                    )}

                    {activeTab === 'configuracion' && (
                        <>
                            <h1 className="text-3xl font-bold text-slate-800 mb-8">Configuración</h1>
                            
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">local_shipping</span>
                                    Configuración de Delivery
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    Define el monto mínimo requerido para que los clientes puedan optar por el servicio de delivery.
                                </p>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Monto mínimo para delivery (USD)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={deliveryMinAmount}
                                            onChange={(e) => setDeliveryMinAmount(parseFloat(e.target.value) || 0)}
                                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-lg"
                                        />
                                    </div>
                                    <button
                                        onClick={saveConfig}
                                        disabled={loadingConfig}
                                        className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">save</span>
                                        {loadingConfig ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                                {msg.text && activeTab === 'configuracion' && (
                                    <p className={`mt-4 text-sm font-medium ${msg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                        {msg.text}
                                    </p>
                                )}
                            </div>

                            <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl text-sm">
                                <p className="font-medium">💡 Información</p>
                                <p className="mt-1">Los clientes que seleccionen &quot;Delivery&quot; deberán tener un monto total mayor o igual a este valor para poder proceder con la compra.</p>
                            </div>
                        </>
                    )}

                    {activeTab === 'usuarios' && (
                        <>
                            <h1 className="text-3xl font-bold text-slate-800 mb-8">Gestión de Usuarios</h1>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                {loadingUsers ? (
                                    <p className="p-8 text-slate-500 text-center animate-pulse">Cargando usuarios registrados...</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="p-4 text-sm font-bold text-slate-600">Usuario</th>
                                                    <th className="p-4 text-sm font-bold text-slate-600">Email</th>
                                                    <th className="p-4 text-sm font-bold text-slate-600">Rol</th>
                                                    <th className="p-4 text-sm font-bold text-slate-600 text-center">Ítems p/ Comprar</th>
                                                    <th className="p-4 text-sm font-bold text-slate-600 text-center">Registro de Actividad</th>
                                                    <th className="p-4 text-sm font-bold text-slate-600">Fecha de Alta</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usersData.map((user) => (
                                                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                                    {user.name?.[0]?.toUpperCase() || 'U'}
                                                                </div>
                                                                <span className="font-semibold text-slate-800">{user.name || 'Sin nombre'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm text-slate-600">{user.cedula}</td>
                                                        <td className="p-4">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
                                                                {user.cartItemCount}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                                                                {user.actionCount}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                                                            {new Date(user.createdAt).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {usersData.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="p-8 text-center text-slate-500">No hay usuarios registrados en el sistema.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
