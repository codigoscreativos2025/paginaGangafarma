"use client";

import SearchBar from "@/components/SearchBar";
import { useCart } from "@/components/CartContext";
import { useLoginModal } from "@/components/LoginModalContext";
import Link from "next/link";

export default function Home() {
  const { openCart, items } = useCart();
  const { openModal } = useLoginModal();
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 pb-28 md:pb-0">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-primary/10">
        <div className="flex items-center justify-between px-4 md:px-10 py-4 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 md:gap-10">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <div className="bg-primary text-white p-2 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">medical_services</span>
              </div>
              <h1 className="text-2xl md:text-2xl font-bold tracking-tight">GangaFarma</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a className="text-base font-semibold text-slate-700 hover:text-primary transition-colors" href="#">Farmacia</a>
              <a className="text-base font-semibold text-slate-700 hover:text-primary transition-colors" href="#">Bienestar</a>
              <a className="text-base font-semibold text-slate-700 hover:text-primary transition-colors" href="#">Belleza</a>
              <a className="text-base font-semibold text-slate-700 hover:text-primary transition-colors" href="#">Ofertas</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openCart} className="relative p-3 hover:bg-primary/10 rounded-full transition-colors">
              <span className="material-symbols-outlined text-3xl">shopping_cart</span>
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </button>
            <button onClick={openModal} className="p-3 hover:bg-primary/10 rounded-full transition-colors">
              <span className="material-symbols-outlined text-3xl">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 md:px-10">
        <section className="py-8 md:py-12">
          <div className="rounded-2xl md:rounded-xl bg-gradient-to-br from-primary to-[#0A2952] p-8 md:p-16 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-secondary rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
            <div className="relative z-10">
              <label className="text-xl md:text-2xl font-bold text-white/90 mb-3 block">Busca tu medicamento</label>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 max-w-2xl leading-tight">Encuentra lo que necesitas para tu salud</h1>
              <p className="text-lg md:text-xl mb-6 md:mb-8 max-w-xl text-blue-100">Escribe el nombre del medicamento o producto que buscas.</p>
              <SearchBar />
              <p className="mt-4 text-base text-white/60">Ejemplo: &quot;Vitamina C&quot; o &quot;Acetaminofen&quot;</p>
            </div>
          </div>
        </section>

        <section className="pb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Categorías</h2>
          </div>
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x hide-scroll-bar">
            {[
              { icon: 'pill', name: 'Farmacia' },
              { icon: 'fitness_center', name: 'Bienestar' },
              { icon: 'face_5', name: 'Belleza' },
              { icon: 'baby_changing_station', name: 'Bebé' },
              { icon: 'spa', name: 'Natural' },
              { icon: 'vaccines', name: 'Especialidad' },
              { icon: 'favorite', name: 'Vitaminas' },
              { icon: 'healing', name: 'Primeros Aux.' }
            ].map((cat, i) => (
              <button key={i} className="snap-start shrink-0 flex flex-col items-center gap-3 group">
                <div className="size-20 md:size-18 bg-white text-primary border-2 border-primary/20 rounded-2xl flex items-center justify-center shadow-md group-hover:bg-primary group-hover:text-white group-active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
                </div>
                <span className="text-base md:text-base font-bold text-center text-slate-800">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="pb-10">
          <div className="relative h-52 md:h-56 rounded-2xl overflow-hidden shadow-xl bg-primary">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-800 opacity-90"></div>
            <div className="relative z-10 p-8 md:p-10 h-full flex flex-col justify-center text-white">
              <span className="bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest py-2 px-3 rounded-full self-start mb-3">Oferta Especial</span>
              <h2 className="text-2xl md:text-4xl font-bold mb-2 leading-tight">Envío Rápido de Medicamentos</h2>
              <p className="text-lg md:text-xl mb-4 text-white/80">Recibe tus medicines directamente en tu hogar</p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20">
              <span className="material-symbols-outlined text-[140px] md:text-[180px] translate-x-10 translate-y-10">local_shipping</span>
            </div>
          </div>
        </section>

        <section className="pb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Ofertas Especiales</h2>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x hide-scroll-bar">
            {[1, 2, 3].map((promo) => (
              <div key={promo} className="snap-start min-w-[300px] md:min-w-[450px] bg-gradient-to-r from-red-500/10 to-transparent border-2 border-red-500/20 rounded-2xl p-6 md:p-8 flex flex-col justify-center shrink-0">
                <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full w-max mb-4">-20% DESCUENTO</span>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">Combo Antigripal Completo</h3>
                <p className="text-base text-slate-500 mt-2 mb-5">Todo lo que necesitas para aliviar el resfriado.</p>
                <button className="text-left font-bold text-primary flex items-center gap-2 group text-lg">Ver Oferta <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span></button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="hidden md:block bg-slate-50 border-t border-slate-200 pt-16 pb-8 mt-auto">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-4xl font-bold">medical_services</span>
                <h2 className="text-2xl font-bold tracking-tight">GangaFarma</h2>
              </div>
              <p className="text-base text-slate-500 leading-relaxed max-w-sm">Tu aliado de confianza para la salud y el bienestar.</p>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-primary text-lg">Comprar</h4>
              <ul className="flex flex-col gap-4 text-base text-slate-600">
                <li><a className="hover:text-primary transition-colors" href="#">Medicamentos</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Vitaminas</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Cuidado Personal</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-primary text-lg">Soporte</h4>
              <ul className="flex flex-col gap-4 text-base text-slate-600">
                <li><a className="hover:text-primary transition-colors" href="#">Contáctanos</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Preguntas Frecuentes</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 text-center">
            <p className="text-sm text-slate-500">© 2024 GangaFarma. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t-2 border-primary/10 px-4 pb-8 pt-3 backdrop-blur-lg">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <Link href="/" className="flex flex-col items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-3xl">home</span>
            <span className="text-xs font-bold">Inicio</span>
          </Link>
          <Link href="/buscar?q=" className="flex flex-col items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined text-3xl">search</span>
            <span className="text-xs font-medium">Buscar</span>
          </Link>
          <div className="relative -top-5">
            <button onClick={openCart} className="bg-primary text-white size-16 rounded-full shadow-xl shadow-primary/40 flex items-center justify-center border-4 border-white">
              <span className="material-symbols-outlined text-4xl">shopping_cart</span>
            </button>
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </div>
          <Link href="/dashboard/admin" className="flex flex-col items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined text-3xl">dashboard</span>
            <span className="text-xs font-medium">Admin</span>
          </Link>
          <button onClick={openModal} className="flex flex-col items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined text-3xl">person</span>
            <span className="text-xs font-medium">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
