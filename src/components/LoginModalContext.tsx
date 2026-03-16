"use client";

import { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";
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

type Step = 1 | 2 | 3;
type AuthMode = 'login' | 'register';

function LoginModal() {
    const { closeModal } = useLoginModal();
    const [mode, setMode] = useState<AuthMode>('login');
    const [cedula, setCedula] = useState("");
    const [telefono, setTelefono] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const router = useRouter();

    const cedulaInputRef = useRef<HTMLInputElement>(null);
    const telefonoInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [fieldStates, setFieldStates] = useState({
        name: 'idle',
        cedula: 'idle',
        telefono: 'idle'
    });

    useEffect(() => {
        if (mode === 'login') {
            setCurrentStep(1);
            setTimeout(() => {
                cedulaInputRef.current?.focus();
                triggerPulseAnimation('cedula');
            }, 300);
        }
    }, [mode]);

    useEffect(() => {
        if (mode === 'login') {
            setTimeout(() => {
                cedulaInputRef.current?.focus();
                triggerPulseAnimation('cedula');
            }, 300);
        }
    }, [mode]);

    const triggerPulseAnimation = (field: 'name' | 'cedula' | 'telefono') => {
        setFieldStates(prev => ({ ...prev, [field]: 'pulse' }));
        setTimeout(() => {
            setFieldStates(prev => ({ ...prev, [field]: 'idle' }));
        }, 2000);
    };

    const validateAndNextStep = () => {
        if (mode === 'register') {
            if (currentStep === 1) {
                if (name.trim().length < 2) {
                    setFieldStates(prev => ({ ...prev, name: 'error' }));
                    setTimeout(() => setFieldStates(prev => ({ ...prev, name: 'idle' })), 500);
                    return;
                }
                setFieldStates(prev => ({ ...prev, name: 'success' }));
                setTimeout(() => setCurrentStep(2), 400);
            } else if (currentStep === 2) {
                if (cedula.trim().length < 5) {
                    setFieldStates(prev => ({ ...prev, cedula: 'error' }));
                    setTimeout(() => setFieldStates(prev => ({ ...prev, cedula: 'idle' })), 500);
                    return;
                }
                setFieldStates(prev => ({ ...prev, cedula: 'success' }));
                setTimeout(() => setCurrentStep(3), 400);
            }
        }
    };

    const getFieldClass = (field: 'name' | 'cedula' | 'telefono') => {
        const base = "w-full px-5 py-4 border-2 rounded-2xl outline-none transition-all text-lg font-medium";
        const state = fieldStates[field];
        
        if (state === 'error') {
            return `${base} border-red-500 bg-red-50 animate-shake`;
        }
        if (state === 'success') {
            return `${base} border-green-500 bg-green-50`;
        }
        if (state === 'pulse') {
            return `${base} border-primary bg-primary/5 ring-4 ring-primary/20`;
        }
        return `${base} border-slate-200 focus:ring-4 focus:ring-primary/20 focus:border-primary`;
    };

    const getLabelClass = (field: 'name' | 'cedula' | 'telefono') => {
        const base = "block text-base font-bold mb-2 transition-colors";
        if (fieldStates[field] === 'success') {
            return `${base} text-green-600`;
        }
        if (fieldStates[field] === 'error') {
            return `${base} text-red-600`;
        }
        return `${base} text-slate-700`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            if (mode === 'login') {
                const response = await signIn('credentials', {
                    redirect: false,
                    cedula,
                    telefono,
                });

                if (response?.error) {
                    setError("Cédula o teléfono incorrecto");
                    setFieldStates(prev => ({ ...prev, cedula: 'error', telefono: 'error' }));
                    setTimeout(() => setFieldStates(prev => ({ ...prev, cedula: 'idle', telefono: 'idle' })), 500);
                } else {
                    setSuccess("¡Sesión iniciada!");
                    setFieldStates(prev => ({ ...prev, cedula: 'success', telefono: 'success' }));
                    setTimeout(() => {
                        closeModal();
                        router.refresh();
                        router.push('/');
                    }, 800);
                }
            } else {
                if (currentStep === 3) {
                    if (telefono.trim().length < 10) {
                        setFieldStates(prev => ({ ...prev, telefono: 'error' }));
                        setTimeout(() => setFieldStates(prev => ({ ...prev, telefono: 'idle' })), 500);
                        setLoading(false);
                        return;
                    }
                }

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, cedula, telefono }),
                });

                if (res.ok) {
                    setFieldStates(prev => ({ ...prev, telefono: 'success' }));
                    setSuccess('¡Cuenta creada! Iniciando sesión...');
                    await signIn('credentials', { redirect: false, cedula, telefono });
                    setTimeout(() => {
                        closeModal();
                        router.refresh();
                    }, 800);
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

    const handleModeChange = (newMode: AuthMode) => {
        setMode(newMode);
        setError("");
        setSuccess("");
        setCurrentStep(1);
        setFieldStates({ name: 'idle', cedula: 'idle', telefono: 'idle' });
        setCedula("");
        setTelefono("");
        setName("");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 h-10 w-10 flex items-center justify-center transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>

                <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4"></div>

                <div className="text-center mb-6">
                    <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4 relative">
                        <span className="material-symbols-outlined text-primary text-4xl">
                            {mode === 'login' ? 'login' : 'person_add'}
                        </span>
                        {mode === 'register' && currentStep === 3 && (
                            <span className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1 animate-bounce">
                                <span className="material-symbols-outlined text-sm">check</span>
                            </span>
                        )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h2>
                    {mode === 'register' && (
                        <p className="text-slate-500 mt-2 text-base">
                            Paso {currentStep} de 3: {
                                currentStep === 1 ? 'Tu nombre' : 
                                currentStep === 2 ? 'Tu cédula' : 
                                'Tu teléfono'
                            }
                        </p>
                    )}
                </div>

                {mode === 'register' && (
                    <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3].map((step) => (
                            <div 
                                key={step}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                    step === currentStep 
                                        ? 'bg-primary scale-125 shadow-lg shadow-primary/50' 
                                        : step < currentStep 
                                            ? 'bg-green-500' 
                                            : 'bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>
                )}

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-base mb-4 text-center font-medium animate-shake">{error}</div>}
                {success && <div className="bg-green-50 text-green-600 p-4 rounded-xl text-base mb-4 text-center font-medium">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {mode === 'register' ? (
                        <>
                            <div className={`transition-all duration-300 ${currentStep === 1 ? 'block' : 'hidden'}`}>
                                <label className={getLabelClass('name')}>Nombre Completo</label>
                                <input
                                    ref={nameInputRef}
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (fieldStates.name === 'error') setFieldStates(prev => ({ ...prev, name: 'idle' }));
                                    }}
                                    required
                                    placeholder="Ej: María Pérez"
                                    className={getFieldClass('name')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            validateAndNextStep();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={validateAndNextStep}
                                    className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all flex justify-center items-center gap-2"
                                >
                                    Siguiente <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </div>

                            <div className={`transition-all duration-300 ${currentStep === 2 ? 'block' : 'hidden'}`}>
                                <label className={getLabelClass('cedula')}>Cédula de Identidad</label>
                                <input
                                    ref={cedulaInputRef}
                                    type="text"
                                    inputMode="numeric"
                                    value={cedula}
                                    onChange={(e) => {
                                        setCedula(e.target.value.replace(/\D/g, ''));
                                        if (fieldStates.cedula === 'error') setFieldStates(prev => ({ ...prev, cedula: 'idle' }));
                                    }}
                                    required
                                    placeholder="Ej: 12345678"
                                    className={getFieldClass('cedula')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            validateAndNextStep();
                                        }
                                    }}
                                />
                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(1)}
                                        className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-medium text-slate-600"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        type="button"
                                        onClick={validateAndNextStep}
                                        className="flex-1 bg-primary text-white font-bold py-3 rounded-xl"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>

                            <div className={`transition-all duration-300 ${currentStep === 3 ? 'block' : 'hidden'}`}>
                                <label className={getLabelClass('telefono')}>Teléfono</label>
                                <input
                                    ref={telefonoInputRef}
                                    type="tel"
                                    inputMode="tel"
                                    value={telefono}
                                    onChange={(e) => {
                                        setTelefono(e.target.value.replace(/\D/g, ''));
                                        if (fieldStates.telefono === 'error') setFieldStates(prev => ({ ...prev, telefono: 'idle' }));
                                    }}
                                    required
                                    placeholder="Ej: 04121234567"
                                    className={getFieldClass('telefono')}
                                />
                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(2)}
                                        className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-medium text-slate-600"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-primary text-white font-bold py-3 rounded-xl disabled:opacity-50"
                                    >
                                        {loading ? 'Creando...' : 'Registrarse'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className={getLabelClass('cedula')}>Cédula de Identidad</label>
                                <input
                                    ref={cedulaInputRef}
                                    type="text"
                                    inputMode="numeric"
                                    value={cedula}
                                    onChange={(e) => {
                                        setCedula(e.target.value.replace(/\D/g, ''));
                                        if (fieldStates.cedula === 'error') setFieldStates(prev => ({ ...prev, cedula: 'idle' }));
                                    }}
                                    required
                                    placeholder="Ej: 12345678"
                                    className={getFieldClass('cedula')}
                                />
                            </div>
                            <div>
                                <label className={getLabelClass('telefono')}>Teléfono</label>
                                <input
                                    ref={telefonoInputRef}
                                    type="tel"
                                    inputMode="tel"
                                    value={telefono}
                                    onChange={(e) => {
                                        setTelefono(e.target.value.replace(/\D/g, ''));
                                        if (fieldStates.telefono === 'error') setFieldStates(prev => ({ ...prev, telefono: 'idle' }));
                                    }}
                                    required
                                    placeholder="Ej: 04121234567"
                                    className={getFieldClass('telefono')}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-2xl transition-all disabled:opacity-50 text-lg flex justify-center items-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98]"
                            >
                                {loading ? <span className="material-symbols-outlined animate-spin text-2xl">refresh</span> : '🔑 Entrar'}
                            </button>
                        </>
                    )}
                </form>

                <div className="mt-6 text-center text-base text-slate-500">
                    {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'}{' '}
                    <button
                        type="button"
                        onClick={() => handleModeChange(mode === 'login' ? 'register' : 'login')}
                        className="text-primary font-bold hover:underline"
                    >
                        {mode === 'login' ? 'Regístrate aquí' : 'Inicia Sesión'}
                    </button>
                </div>
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
        </div>
    );
}
