import Image from "next/image";

const categorias = [
  { img: "/images/productos/Brocoli.png", nombre: "Verduras", descripcion: "De temporada, siempre frescas" },
  { img: "/images/productos/Arandano.png", nombre: "Frutas", descripcion: "Dulces y en su punto justo" },
  { img: "/images/productos/Huevo.png", nombre: "Huevos", descripcion: "De campo, con cáscara fuerte" },
  { img: "/images/productos/Albaca.png", nombre: "Hierbas", descripcion: "Frescas para tu cocina" },
  { img: "/images/productos/Brocoli.png", nombre: "Kits", descripcion: "Canastas armadas para la semana" },
];

export default function Variedad() {
  return (
    <section id="catalogo" className="bg-[#f9fafb] py-24 px-9 md:px-[4.5rem]">
      <div className="max-w-7xl mx-auto">

        {/* Header + imagen lado a lado */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
          <div className="flex-1">
            <span className="font-pacifico text-[#F9C514] text-2xl">Frescon</span>
            <h2 className="font-nunito font-black text-[#1A1A1A] text-4xl md:text-6xl leading-tight mt-2">
              VARIEDAD PARA TU MESA
            </h2>
            <p className="text-[#666666] text-lg mt-4 max-w-md">
              Todo lo que necesitas para una semana deliciosa, en un solo pedido.
            </p>
          </div>

          {/* Imagen con elemento flotante */}
          <div className="flex-1 relative flex justify-center md:justify-end h-64">
            <div className="w-72 h-56 rounded-3xl overflow-hidden shadow-xl">
              <Image src="/images/foto4.png" alt="Variedad de alimentos" fill className="object-cover" />
            </div>
          </div>
        </div>

        {/* Grid categorías */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {categorias.map((cat) => (
            <div
              key={cat.nombre}
              className="bg-white rounded-3xl p-6 text-center hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1"
            >
              <div className="h-16 flex items-center justify-center mb-3">
                <Image
                  src={cat.img}
                  alt={cat.nombre}
                  width={64}
                  height={64}
                  className="object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="font-nunito font-black text-[#1A1A1A] text-base">{cat.nombre}</h3>
              <p className="text-[#666666] text-xs mt-1">{cat.descripcion}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href="#productos" className="inline-block bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-10 py-4 rounded-full transition-colors text-lg">
            Ver todos los productos
          </a>
        </div>
      </div>
    </section>
  );
}
