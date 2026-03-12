"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type LoginModalContextType = {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
};

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function useLoginModal() {
    const context = useContext(LoginModalContext);
    if (!context) {
        throw new Error("useLoginModal debe ser usado dentro de LoginModalProvider");
    }
    return context;
}

export function LoginModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    return (
        <LoginModalContext.Provider value={{ isOpen, openModal, closeModal }}>
            {children}
            {isOpen && <LoginModal />}
        </LoginModalContext.Provider>
    );
}

function LoginModal() {
    const { closeModal } = useLoginModal();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            if (isLogin) {
                const response = await signIn('credentials', {
                    redirect: false,
                    email,
                    password,
                });

                if (response?.error) {
                    setError("Credenciales inválidas");
                } else {
                    setTimeout(() => {
                        closeModal();
                        router.push('/dashboard/admin');
                        router.refresh();
                    }, 1000);
                }
            } else {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, name }),
                });

                if (res.ok) {
                    setSuccess('Usuario registrado. Iniciando sesión...');
                    await signIn('credentials', { redirect: false, email, password });
                    setTimeout(() => {
                        closeModal();
                        router.refresh();
                    }, 1000);
                } else {
                    const data = await res.json();
                    setError(data.error || 'Error al registrar');
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 h-8 w-8 flex items-center justify-center transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>

                <div className="text-center mb-6">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">medical_services</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
                    <p className="text-slate-500 mt-2 text-sm">
                        {isLogin ? 'Accede para gestionar tu perfil y tu carrito' : 'Únete a GangaFarma hoy mismo'}
                    </p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">{error}</div>}
                {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 text-center">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-4 flex justify-center items-center"
                    >
                        {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : (isLogin ? 'Entrar' : 'Registrarse')}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'}{' '}
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError("");
                            setSuccess("");
                        }}
                        className="text-primary font-bold hover:underline"
                    >
                        {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
}
