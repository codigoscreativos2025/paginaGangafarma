import SearchBar from "@/components/SearchBar";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-3xl font-bold">medical_services</span>
              <h2 className="text-xl font-bold tracking-tight text-primary">GangaFarma</h2>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a className="text-sm font-semibold text-slate-700 hover:text-highlight transition-colors" href="#">Farmacia</a>
              <a className="text-sm font-semibold text-slate-700 hover:text-highlight transition-colors" href="#">Bienestar</a>
              <a className="text-sm font-semibold text-slate-700 hover:text-highlight transition-colors" href="#">Belleza</a>
              <a className="text-sm font-semibold text-slate-700 hover:text-highlight transition-colors" href="#">Ofertas</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center justify-center rounded-lg p-2 hover:bg-primary/10 text-primary">
              <span className="material-symbols-outlined">shopping_cart</span>
            </button>
            <button className="flex items-center justify-center rounded-lg p-2 hover:bg-primary/10 text-primary">
              <span className="material-symbols-outlined">person</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
        {/* Hero Search Section */}
        <section className="mb-12">
          <div className="rounded-xl bg-gradient-to-br from-primary to-[#0A2952] p-8 md:p-16 text-white shadow-xl shadow-primary/10 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-secondary rounded-full blur-[120px] opacity-30 pointer-events-none"></div>

            <div className="relative z-10">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 max-w-2xl leading-tight">Encuentra todo lo que necesitas para tu salud</h1>
              <p className="text-blue-100 mb-8 max-w-xl text-lg">Busca medicamentos, vitaminas y productos de cuidado personal al mejor precio de la ciudad.</p>

              <SearchBar />

              <div className="mt-6 flex flex-wrap gap-3 items-center">
                <span className="text-sm font-medium opacity-80 text-light">Populares:</span>
                <a className="text-sm bg-white/10 border border-white/20 hover:bg-white/20 px-4 py-1.5 rounded-full transition-all text-light backdrop-blur-sm" href="#">Vitamina C</a>
                <a className="text-sm bg-white/10 border border-white/20 hover:bg-white/20 px-4 py-1.5 rounded-full transition-all text-light backdrop-blur-sm" href="#">Analgésicos</a>
                <a className="text-sm bg-white/10 border border-white/20 hover:bg-white/20 px-4 py-1.5 rounded-full transition-all text-light backdrop-blur-sm" href="#">Higiene</a>
              </div>
            </div>
          </div>
        </section>

        {/* Wellness Categories */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">Categorías de Bienestar</h2>
            <a className="text-highlight font-semibold text-sm flex items-center gap-1 hover:underline" href="#">Ver Todas <span className="material-symbols-outlined text-xs">arrow_forward</span></a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: 'pill', name: 'Farmacia' },
              { icon: 'fitness_center', name: 'Bienestar' },
              { icon: 'face_5', name: 'Belleza' },
              { icon: 'baby_changing_station', name: 'Cuidado Bebé' },
              { icon: 'spa', name: 'Natural' },
              { icon: 'vaccines', name: 'Especialidades' }
            ].map((cat, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-6 rounded-xl bg-white border border-slate-200 hover:border-primary hover:shadow-lg transition-all cursor-pointer group">
                <div className="w-14 h-14 rounded-full bg-light flex items-center justify-center group-hover:bg-primary group-hover:text-white text-primary transition-colors">
                  <span className="material-symbols-outlined">{cat.icon}</span>
                </div>
                <span className="text-sm font-bold text-center text-slate-800">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8 mt-auto">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-3xl font-bold">medical_services</span>
                <h2 className="text-xl font-bold tracking-tight">GangaFarma</h2>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm">Tu aliado de confianza para la salud y el bienestar. Medicamentos de calidad al mejor precio.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-primary">Comprar</h4>
              <ul className="flex flex-col gap-3 text-sm text-slate-600">
                <li><a className="hover:text-highlight transition-colors" href="#">Medicamentos</a></li>
                <li><a className="hover:text-highlight transition-colors" href="#">Vitaminas y Suplementos</a></li>
                <li><a className="hover:text-highlight transition-colors" href="#">Cuidado Personal</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-primary">Soporte</h4>
              <ul className="flex flex-col gap-3 text-sm text-slate-600">
                <li><a className="hover:text-highlight transition-colors" href="#">Contáctanos</a></li>
                <li><a className="hover:text-highlight transition-colors" href="#">Preguntas Frecuentes</a></li>
                <li><a className="hover:text-highlight transition-colors" href="#">Términos y Condiciones</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">© 2024 GangaFarma. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
