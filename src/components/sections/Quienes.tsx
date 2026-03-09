import Image from "next/image";

export default function Quienes() {
  return (
    <section className="bg-[#f9fafb] py-24 px-9 md:px-[4.5rem]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-16">

        {/* Imagen derecha con profundidad */}
        <div className="flex-1 relative flex justify-center">
          <div className="absolute w-64 h-64 bg-[#F9C514]/15 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10 w-64 h-80 md:w-72 md:h-[26rem] rounded-3xl overflow-hidden shadow-xl">
            <Image
              src="/images/foto2.png"
              alt="Selección de productos Frescon"
              fill
              className="object-cover"
            />
          </div>

          {/* Badge flotante */}
          <div className="absolute -bottom-4 -left-4 md:-left-8 z-20 bg-[#2A7A26] text-white rounded-2xl shadow-xl p-4 w-40">
            <p className="font-nunito font-black text-xs text-[#F9C514]">PRODUCTORES</p>
            <p className="font-nunito font-black text-sm mt-0.5">100% locales</p>
          </div>
        </div>

        {/* Texto izquierda */}
        <div className="flex-1 max-w-xl">
          <span className="font-pacifico text-[#F9C514] text-2xl">Frescon</span>
          <h2 className="font-nunito font-black text-[#1A1A1A] text-4xl md:text-5xl leading-tight mt-2 mb-10">
            NUESTRO EQUIPO Y VALORES
          </h2>

          <div className="flex flex-col gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#3AAA35]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Image src="/images/productos/PorotosVerdes.png" alt="Productores" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <h3 className="font-nunito font-black text-[#1A1A1A] text-xl mb-1">PRODUCTORES LOCALES</h3>
                <p className="text-[#666666] leading-relaxed">
                  Trabajamos directamente con agricultores de la región para garantizar
                  la máxima frescura y apoyar la economía local.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F9C514]/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Image src="/images/productos/Zanahoria.png" alt="Selección" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <h3 className="font-nunito font-black text-[#1A1A1A] text-xl mb-1">SELECCIÓN CON CARIÑO</h3>
                <p className="text-[#666666] leading-relaxed">
                  Cada producto pasa por nuestra revisión antes de llegar a tu canasta.
                  Solo lo mejor de la semana, siempre en su punto justo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
