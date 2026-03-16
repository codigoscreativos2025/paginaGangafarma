'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

type Step = 1 | 2 | 3;

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [cedula, setCedula] = useState('');
    const [telefono, setTelefono] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const router = useRouter();

    const nameInputRef = useRef<HTMLInputElement>(null);
    const cedulaInputRef = useRef<HTMLInputElement>(null);
    const telefonoInputRef = useRef<HTMLInputElement>(null);

    const [fieldStates, setFieldStates] = useState({
        name: 'idle',
        cedula: 'idle',
        telefono: 'idle'
    });

    useEffect(() => {
        if (currentStep === 1 && nameInputRef.current) {
            setTimeout(() => {
                nameInputRef.current?.focus();
                triggerPulseAnimation('name');
            }, 300);
        }
    }, [currentStep]);

    const triggerPulseAnimation = (field: 'name' | 'cedula' | 'telefono') => {
        setFieldStates(prev => ({ ...prev, [field]: 'pulse' }));
        setTimeout(() => {
            setFieldStates(prev => ({ ...prev, [field]: 'idle' }));
        }, 2000);
    };

    const validateAndNextStep = () => {
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
        
        if (telefono.trim().length < 2) {
            setFieldStates(prev => ({ ...prev, telefono: 'error' }));
            setTimeout(() => setFieldStates(prev => ({ ...prev, telefono: 'idle' })), 500);
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, cedula, telefono }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al registrar');
            }

            setFieldStates(prev => ({ ...prev, telefono: 'success' }));
            setSuccess('¡Cuenta creada! Iniciando sesión...');
            
            const signInResult = await signIn('credentials', { 
                redirect: false, 
                cedula, 
                telefono 
            });
            
            if (signInResult?.error) {
                throw new Error('Error al iniciar sesión automática');
            }
            
            setTimeout(() => {
                router.refresh();
                router.push('/');
            }, 1500);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError('Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-end sm:items-center justify-center bg-gradient-to-br from-primary/5 via-slate-50 to-secondary/5 p-0 sm:p-4">
            <div className="max-w-md w-full bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
                    <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / 3) * 100}%` }}
                    />
                </div>

                <div className="text-center mb-6 mt-2">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-4 relative">
                        <span className="material-symbols-outlined text-4xl">person_add</span>
                        {currentStep === 3 && (
                            <span className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1 animate-bounce">
                                <span className="material-symbols-outlined text-sm">check</span>
                            </span>
                        )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Crear Cuenta</h2>
                    <p className="text-slate-500 mt-2 text-base">
                        Paso {currentStep} de 3: {
                            currentStep === 1 ? 'Tu nombre' : 
                            currentStep === 2 ? 'Tu cédula' : 
                            'Tu teléfono'
                        }
                    </p>
                </div>

                <div className="flex justify-center gap-2 mb-6">
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

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-base text-center mb-4 font-medium animate-shake">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 text-green-600 p-4 rounded-xl text-base text-center mb-4 font-medium">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className={`transition-all duration-300 ${currentStep === 1 ? 'block' : 'hidden'}`}>
                        <label className={getLabelClass('name')}>Nombre Completo</label>
                        <input
                            ref={nameInputRef}
                            type="text"
                            required
                            className={getFieldClass('name')}
                            placeholder="Ej: María Pérez"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (fieldStates.name === 'error') setFieldStates(prev => ({ ...prev, name: 'idle' }));
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    validateAndNextStep();
                                }
                            }}
                        />
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm animate-pulse">arrow_forward</span>
                            Escribe tu nombre y presiona Enter
                        </p>
                        <button
                            type="button"
                            onClick={validateAndNextStep}
                            className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all flex justify-center items-center gap-2 text-lg shadow-lg shadow-primary/20 active:scale-[0.98]"
                        >
                            Continuar
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>

                    <div className={`transition-all duration-300 ${currentStep === 2 ? 'block' : 'hidden'}`}>
                        <label className={getLabelClass('cedula')}>Cédula de Identidad</label>
                        <input
                            ref={cedulaInputRef}
                            type="text"
                            required
                            className={getFieldClass('cedula')}
                            placeholder="Ej: admin123456"
                            value={cedula}
                            onChange={(e) => {
                                setCedula(e.target.value);
                                if (fieldStates.cedula === 'error') setFieldStates(prev => ({ ...prev, cedula: 'idle' }));
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    validateAndNextStep();
                                }
                            }}
                        />
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm animate-pulse">arrow_forward</span>
                            Ingresa tu número de cédula y presiona Enter
                        </p>
                        <div className="flex gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="flex-1 py-4 border-2 border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Atrás
                            </button>
                            <button
                                type="button"
                                onClick={validateAndNextStep}
                                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all flex justify-center items-center gap-2 text-lg shadow-lg shadow-primary/20 active:scale-[0.98]"
                            >
                                Continuar
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ${currentStep === 3 ? 'block' : 'hidden'}`}>
                        <label className={getLabelClass('telefono')}>Teléfono</label>
                        <input
                            ref={telefonoInputRef}
                            type="text"
                            required
                            className={getFieldClass('telefono')}
                            placeholder="Ej: admingangarma"
                            value={telefono}
                            onChange={(e) => {
                                setTelefono(e.target.value);
                                if (fieldStates.telefono === 'error') setFieldStates(prev => ({ ...prev, telefono: 'idle' }));
                            }}
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Ingresa tu teléfono de contacto
                        </p>
                        <div className="flex gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className="flex-1 py-4 border-2 border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Atrás
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-bold py-4 px-4 rounded-2xl transition-all flex justify-center items-center gap-2 text-lg shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="material-symbols-outlined animate-spin text-2xl">refresh</span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Finalizar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                <p className="text-center text-base text-slate-500 mt-6">
                    ¿Ya tienes cuenta? <Link href="/login" className="text-primary hover:underline font-bold">Inicia Sesión</Link>
                </p>
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
