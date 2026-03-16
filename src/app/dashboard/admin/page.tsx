'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';

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

    const [activeTab, setActiveTab] = useState<'productos' | 'analiticas' | 'ofertas' | 'usuarios' | 'configuracion' | 'workers' | 'pagos'>('productos');
    const [codigo, setCodigo] = useState('');
    const [productData, setProductData] = useState<ProductDetail | null>(null);

    const [analyticsData, setAnalyticsData] = useState<AnalyticsLogInfo[]>([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [usersData, setUsersData] = useState<UserInfoRow[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [desc, setDesc] = useState('');
    const [howToUse, setHowToUse] = useState('');
    const [warnings, setWarnings] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [deliveryMinAmount, setDeliveryMinAmount] = useState<number>(5.0);
    const [loadingConfig, setLoadingConfig] = useState(false);

    // Workers state
    const [workersData, setWorkersData] = useState<UserInfoRow[]>([]);
    const [loadingWorkers, setLoadingWorkers] = useState(false);
    const [newWorkerName, setNewWorkerName] = useState('');
    const [newWorkerCedula, setNewWorkerCedula] = useState('');
    const [newWorkerTelefono, setNewWorkerTelefono] = useState('');

    // Payment methods state
    const [paymentMethodsData, setPaymentMethodsData] = useState<{id: string; name: string; instructions: string; isActive: boolean}[]>([]);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
    const [newPaymentName, setNewPaymentName] = useState('');
    const [newPaymentInstructions, setNewPaymentInstructions] = useState('');

    // Config state
    const [webhookChatUrl, setWebhookChatUrl] = useState('');
    const [aiEnabled, setAiEnabled] = useState(true);

    // Offers state
    const [offersData, setOffersData] = useState<{id: string; codigo: string; title: string; description: string; discount: number; active: boolean}[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(false);
    const [newOfferCodigo, setNewOfferCodigo] = useState('');
    const [newOfferTitle, setNewOfferTitle] = useState('');
    const [newOfferDescription, setNewOfferDescription] = useState('');
    const [newOfferDiscount, setNewOfferDiscount] = useState(0);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [dateFilter, setDateFilter] = useState('7');

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
            if (data.config?.webhookChatUrl) {
                setWebhookChatUrl(data.config.webhookChatUrl);
            }
            if (data.config?.aiEnabled !== undefined) {
                setAiEnabled(data.config.aiEnabled);
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
                body: JSON.stringify({ 
                    deliveryMinAmount,
                    webhookChatUrl,
                    aiEnabled
                })
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

    // Workers functions
    const loadWorkers = async () => {
        setLoadingWorkers(true);
        try {
            const res = await fetch('/api/admin/workers');
            const data = await res.json();
            if (data.workers) {
                setWorkersData(data.workers);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingWorkers(false);
        }
    };

    const handleCreateWorker = async () => {
        if (!newWorkerName || !newWorkerCedula || !newWorkerTelefono) {
            setMsg({ text: 'Todos los campos son requeridos', type: 'error' });
            return;
        }
        setLoadingWorkers(true);
        try {
            const res = await fetch('/api/admin/workers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newWorkerName, cedula: newWorkerCedula, telefono: newWorkerTelefono })
            });
            if (res.ok) {
                setMsg({ text: 'Trabajador creado exitosamente', type: 'success' });
                setNewWorkerName('');
                setNewWorkerCedula('');
                setNewWorkerTelefono('');
                loadWorkers();
            } else {
                setMsg({ text: 'Error al crear trabajador', type: 'error' });
            }
        } catch {
            setMsg({ text: 'Error al crear trabajador', type: 'error' });
        } finally {
            setLoadingWorkers(false);
        }
    };

    const handleDeleteWorker = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este trabajador?')) return;
        try {
            await fetch(`/api/admin/workers?id=${id}`, { method: 'DELETE' });
            loadWorkers();
        } catch (e) {
            console.error(e);
        }
    };

    // Payment Methods functions
    const loadPaymentMethods = async () => {
        setLoadingPaymentMethods(true);
        try {
            const res = await fetch('/api/payment-methods');
            const data = await res.json();
            if (data.methods) {
                setPaymentMethodsData(data.methods);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingPaymentMethods(false);
        }
    };

    const handleCreatePaymentMethod = async () => {
        if (!newPaymentName || !newPaymentInstructions) {
            setMsg({ text: 'Nombre e instrucciones son requeridos', type: 'error' });
            return;
        }
        setLoadingPaymentMethods(true);
        try {
            const res = await fetch('/api/payment-methods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPaymentName, instructions: newPaymentInstructions })
            });
            if (res.ok) {
                setMsg({ text: 'Método de pago creado', type: 'success' });
                setNewPaymentName('');
                setNewPaymentInstructions('');
                loadPaymentMethods();
            }
        } catch {
            setMsg({ text: 'Error al crear método', type: 'error' });
        } finally {
            setLoadingPaymentMethods(false);
        }
    };

    const handleTogglePaymentMethod = async (id: string, isActive: boolean) => {
        try {
            await fetch('/api/payment-methods', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !isActive })
            });
            loadPaymentMethods();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeletePaymentMethod = async (id: string) => {
        if (!confirm('¿Eliminar método de pago?')) return;
        try {
            await fetch(`/api/payment-methods?id=${id}`, { method: 'DELETE' });
            loadPaymentMethods();
        } catch (e) {
            console.error(e);
        }
    };

    // Offers functions
    const loadOffers = async () => {
        setLoadingOffers(true);
        try {
            const offers = await prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
            setOffersData(offers.map(o => ({
                id: o.id,
                codigo: o.codigo,
                title: o.title || '',
                description: o.description || '',
                discount: o.discount || 0,
                active: o.active
            })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingOffers(false);
        }
    };

    const handleCreateOffer = async () => {
        if (!newOfferCodigo || !newOfferTitle) {
            setMsg({ text: 'Código y título son requeridos', type: 'error' });
            return;
        }
        setLoadingOffers(true);
        try {
            await prisma.promotion.create({
                data: {
                    codigo: newOfferCodigo,
                    title: newOfferTitle,
                    description: newOfferDescription,
                    discount: newOfferDiscount,
                    active: true
                }
            });
            setMsg({ text: 'Oferta creada', type: 'success' });
            setNewOfferCodigo('');
            setNewOfferTitle('');
            setNewOfferDescription('');
            setNewOfferDiscount(0);
            loadOffers();
        } catch {
            setMsg({ text: 'Error al crear oferta', type: 'error' });
        } finally {
            setLoadingOffers(false);
        }
    };

    const handleToggleOffer = async (id: string, active: boolean) => {
        try {
            await prisma.promotion.update({
                where: { id },
                data: { active: !active }
            });
            loadOffers();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteOffer = async (id: string) => {
        if (!confirm('¿Eliminar oferta?')) return;
        try {
            await prisma.promotion.delete({ where: { id } });
            loadOffers();
        } catch (e) {
            console.error(e);
        }
    };

    // Delete user function
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleDeleteUser = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
            loadUsers();
        } catch (e) {
            console.error(e);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleUpdateUserRole = async (id: string, role: string) => {
        try {
            await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, role })
            });
            loadUsers();
        } catch (e) {
            console.error(e);
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
                    <button onClick={() => { setActiveTab('workers'); loadWorkers(); }} className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'workers' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}`}>
                        <span className="material-symbols-outlined">support_agent</span>
                        Trabajadores
                    </button>
                    <button onClick={() => { setActiveTab('ofertas'); loadOffers(); }} className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'ofertas' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}`}>
                        <span className="material-symbols-outlined">campaign</span>
                        Promo y Ofertas
                    </button>
                    <button onClick={() => { setActiveTab('pagos'); loadPaymentMethods(); }} className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'pagos' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}`}>
                        <span className="material-symbols-outlined">payment</span>
                        Métodos de Pago
                    </button>
                    <button onClick={() => { setActiveTab('configuracion'); loadConfig(); }} className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'configuracion' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}`}>
                        <span className="material-symbols-outlined">settings</span>
                        Configuración
                    </button>
                    <button onClick={() => setActiveTab('ofertas')} className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'ofertas' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}`}>
                        <span className="material-symbols-outlined">campaign</span>
                        Promo y Ofertas
                    </button>
                    <button onClick={() => setActiveTab('pagos')} className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'pagos' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}`}>
                        <span className="material-symbols-outlined">payment</span>
                        Métodos de Pago
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

                    {activeTab === 'workers' && (
                        <>
                            <h1 className="text-3xl font-bold text-slate-800 mb-8">Gestión de Trabajadores</h1>
                            
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                                <h3 className="font-semibold text-slate-700 mb-4">Crear Nuevo Trabajador</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Nombre completo"
                                        value={newWorkerName}
                                        onChange={(e) => setNewWorkerName(e.target.value)}
                                        className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Cédula"
                                        value={newWorkerCedula}
                                        onChange={(e) => setNewWorkerCedula(e.target.value)}
                                        className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Teléfono"
                                            value={newWorkerTelefono}
                                            onChange={(e) => setNewWorkerTelefono(e.target.value)}
                                            className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                        />
                                        <button
                                            onClick={handleCreateWorker}
                                            disabled={loadingWorkers}
                                            className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                {loadingWorkers ? (
                                    <p className="p-8 text-slate-500 text-center animate-pulse">Cargando...</p>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="p-4 text-sm font-bold text-slate-600">Nombre</th>
                                                <th className="p-4 text-sm font-bold text-slate-600">Cédula</th>
                                                <th className="p-4 text-sm font-bold text-slate-600">Teléfono</th>
                                                <th className="p-4 text-sm font-bold text-slate-600">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {workersData.map((worker) => (
                                                <tr key={worker.id} className="border-b border-slate-100">
                                                    <td className="p-4 font-medium">{worker.name}</td>
                                                    <td className="p-4 text-slate-600">{worker.cedula}</td>
                                                    <td className="p-4 text-slate-600">{worker.telefono}</td>
                                                    <td className="p-4">
                                                        <button
                                                            onClick={() => handleDeleteWorker(worker.id)}
                                                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {workersData.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-500">No hay trabajadores creados.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'pagos' && (
                        <>
                            <h1 className="text-3xl font-bold text-slate-800 mb-8">Métodos de Pago</h1>
                            
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                                <h3 className="font-semibold text-slate-700 mb-4">Agregar Método de Pago</h3>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Nombre (Ej: Transferencia Banesco)"
                                        value={newPaymentName}
                                        onChange={(e) => setNewPaymentName(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                    <textarea
                                        placeholder="Datos para el pago (número de cuenta, referencia, etc.)"
                                        value={newPaymentInstructions}
                                        onChange={(e) => setNewPaymentInstructions(e.target.value)}
                                        rows={3}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                    <button
                                        onClick={handleCreatePaymentMethod}
                                        disabled={loadingPaymentMethods}
                                        className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        Agregar Método
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {paymentMethodsData.map((method) => (
                                    <div key={method.id} className={`bg-white p-6 rounded-xl border-2 ${method.isActive ? 'border-green-200' : 'border-slate-200'}`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">{method.name}</h3>
                                                <p className="text-slate-600 mt-2 whitespace-pre-line">{method.instructions}</p>
                                                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold ${method.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {method.isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleTogglePaymentMethod(method.id, method.isActive)}
                                                    className={`px-3 py-1 rounded text-sm font-medium ${method.isActive ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                                                >
                                                    {method.isActive ? 'Desactivar' : 'Activar'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePaymentMethod(method.id)}
                                                    className="px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-700"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {paymentMethodsData.length === 0 && (
                                    <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                                        No hay métodos de pago configurados.
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'ofertas' && (
                        <>
                            <h1 className="text-3xl font-bold text-slate-800 mb-8">Promociones y Ofertas</h1>
                            
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                                <h3 className="font-semibold text-slate-700 mb-4">Crear Nueva Oferta</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Código del producto"
                                        value={newOfferCodigo}
                                        onChange={(e) => setNewOfferCodigo(e.target.value)}
                                        className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Título de la oferta"
                                        value={newOfferTitle}
                                        onChange={(e) => setNewOfferTitle(e.target.value)}
                                        className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Descuento %"
                                        value={newOfferDiscount}
                                        onChange={(e) => setNewOfferDiscount(Number(e.target.value))}
                                        className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Descripción"
                                        value={newOfferDescription}
                                        onChange={(e) => setNewOfferDescription(e.target.value)}
                                        className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleCreateOffer}
                                    disabled={loadingOffers}
                                    className="mt-4 bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Crear Oferta
                                </button>
                            </div>

                            <div className="grid gap-4">
                                {offersData.map((offer) => (
                                    <div key={offer.id} className={`bg-white p-6 rounded-xl border-2 ${offer.active ? 'border-green-200' : 'border-slate-200'}`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg text-slate-800">{offer.title}</h3>
                                                    {offer.discount > 0 && (
                                                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">-{offer.discount}%</span>
                                                    )}
                                                </div>
                                                <p className="text-slate-500 text-sm mt-1">Código: {offer.codigo}</p>
                                                <p className="text-slate-600 mt-2">{offer.description}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleOffer(offer.id, offer.active)}
                                                    className={`px-3 py-1 rounded text-sm font-medium ${offer.active ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                                                >
                                                    {offer.active ? 'Desactivar' : 'Activar'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOffer(offer.id)}
                                                    className="px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-700"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {offersData.length === 0 && (
                                    <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                                        No hay ofertas creadas.
                                    </div>
                                )}
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
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-600">smart_toy</span>
                                    Configuración de Chat IA (Remedina)
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Webhook de n8n (URL)
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://tu-servidor-n8n.com/webhook/chat"
                                            value={webhookChatUrl}
                                            onChange={(e) => setWebhookChatUrl(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">URL del webhook de n8n que recibe los mensajes</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="font-bold text-slate-700">IA Activa</p>
                                            <p className="text-sm text-slate-500">Cuando está activo, los mensajes van a n8n</p>
                                        </div>
                                        <button
                                            onClick={() => setAiEnabled(!aiEnabled)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${aiEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                                        <p className="font-bold text-purple-700 mb-2">📡 Endpoint para respuesta de n8n</p>
                                        <code className="block bg-white px-3 py-2 rounded text-sm text-slate-700 overflow-x-auto">
                                            POST /api/chat/response
                                        </code>
                                        <p className="text-xs text-purple-600 mt-2">
                                            Envía un HTTP Request desde n8n a esta URL con: {"{ \"conversationId\": \"...\", \"message\": \"...\" }"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {msg.text && activeTab === 'configuracion' && (
                                <p className={`mt-4 text-sm font-medium ${msg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                    {msg.text}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
