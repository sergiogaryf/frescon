import Image from "next/image";

export default function Mision() {
  return (
    <section className="bg-white py-24 px-9 md:px-[4.5rem]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">

        {/* Imagen izquierda con profundidad */}
        <div className="flex-1 relative flex justify-center">
          {/* Círculo decorativo fondo */}
          <div className="absolute w-72 h-72 md:w-80 md:h-80 bg-[#3AAA35]/10 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

          {/* Foto principal */}
          <div className="relative z-10 w-72 h-80 md:w-80 md:h-96 rounded-3xl overflow-hidden shadow-xl">
            <Image
              src="/images/foto1.png"
              alt="Verduras frescas Frescon"
              fill
              className="object-cover"
            />
          </div>

        </div>

        {/* Texto derecha */}
        <div className="flex-1 max-w-xl">
          <span className="font-pacifico text-[#F9C514] text-2xl">Frescura Real</span>
          <h2 className="font-nunito font-black text-[#1A1A1A] text-4xl md:text-6xl leading-tight mt-2 mb-6">
            NUESTRO COMPROMISO CONTIGO
          </h2>
          <p className="text-[#666666] text-lg leading-relaxed mb-8">
            Llevamos las mejores verduras y frutas de temporada directamente a tu puerta,
            seleccionadas con cariño cada semana. Sin vueltas, sin intermediarios,
            sin perder frescura en el camino.
          </p>
          <a
            href="#catalogo"
            className="inline-block bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-8 py-4 rounded-full transition-colors"
          >
            Ver productos
          </a>
        </div>
      </div>
    </section>
  );
}
