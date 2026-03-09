const razones = [
  {
    titulo: "PRECIOS JUSTOS",
    descripcion: "Sin intermediarios, el precio justo del campo directo a tu mesa.",
    icon: "💚",
    destaca: false,
  },
  {
    titulo: "DELIVERY PUNTUAL",
    descripcion: "Todos los jueves, sin falta, en la puerta de tu casa.",
    icon: "🚚",
    destaca: true,
  },
  {
    titulo: "PRODUCTOS DE TEMPORADA",
    descripcion: "Siempre lo más fresco según la época del año, con variedad real.",
    icon: "🌿",
    destaca: false,
  },
];

export default function PorQueElegirnos() {
  return (
    <section className="bg-white py-24 px-9 md:px-[4.5rem]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-start">

        {/* Título izquierda */}
        <div className="md:w-1/3 md:sticky md:top-24">
          <span className="font-pacifico text-[#F9C514] text-2xl">Por qué Frescon</span>
          <h2 className="font-nunito font-black text-[#1A1A1A] text-4xl md:text-5xl leading-tight mt-2">
            CALIDAD QUE SE NOTA
          </h2>
        </div>

        {/* Razones derecha */}
        <div className="flex-1 flex flex-col gap-6">
          {razones.map((r) => (
            <div
              key={r.titulo}
              className={`rounded-3xl p-8 flex items-start gap-6 transition-all ${
                r.destaca
                  ? "bg-[#3AAA35] text-white"
                  : "bg-[#f9fafb] text-[#1A1A1A]"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  r.destaca ? "bg-white/20" : "bg-[#3AAA35]/10"
                }`}
              >
                {r.icon}
              </div>
              <div>
                <h3
                  className={`font-nunito font-black text-xl mb-2 ${
                    r.destaca ? "text-[#F9C514]" : "text-[#1A1A1A]"
                  }`}
                >
                  {r.titulo}
                </h3>
                <p className={r.destaca ? "text-white/80" : "text-[#666666]"}>
                  {r.descripcion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
