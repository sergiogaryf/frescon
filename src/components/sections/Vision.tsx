import Image from "next/image";

const items = [
  {
    titulo: "SIN INTERMEDIARIOS",
    descripcion: "Conectamos directamente al productor con tu mesa, garantizando precios justos y frescura real en cada entrega.",
  },
  {
    titulo: "COMUNIDAD SANA",
    descripcion: "Queremos que cada familia acceda a alimentos frescos y saludables sin complicaciones ni sobrecostos.",
  },
];

export default function Vision() {
  return (
    <section className="bg-[#2A7A26] py-24 px-9 md:px-[4.5rem] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#3AAA35]/30 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#1A5C18]/50 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row gap-12 items-center">

        {/* Título izquierda */}
        <div className="md:w-2/5">
          <span className="font-pacifico text-[#F9C514] text-2xl">Nuestra Visión</span>
          <h2 className="font-nunito font-black text-white text-4xl md:text-6xl leading-tight mt-2">
            FRESCURA PARA TODOS
          </h2>
        </div>

        {/* Imagen centro con elemento flotante */}
        <div className="hidden md:flex flex-1 justify-center relative h-64">
          <div className="w-44 h-56 rounded-3xl overflow-hidden shadow-2xl">
            <Image src="/images/foto5.png" alt="Comunidad Frescon" fill className="object-cover" />
          </div>
        </div>

        {/* Items derecha */}
        <div className="md:w-2/5 flex flex-col gap-8">
          {items.map((item) => (
            <div key={item.titulo}>
              <h3 className="font-nunito font-black text-[#F9C514] text-xl mb-2">{item.titulo}</h3>
              <p className="text-white/75 leading-relaxed">{item.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
