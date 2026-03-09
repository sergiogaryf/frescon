import Image from "next/image";

const principios = [
  {
    titulo: "DIRECTO DEL CAMPO",
    descripcion: "Seleccionamos solo productos frescos sin pasar por intermediarios, del agricultor a tu canasta.",
    oscuro: true,
  },
  {
    titulo: "PEDIDOS A TU MEDIDA",
    descripcion: "Elige exactamente lo que necesitas, sin pagar por lo que no usas. Tú controlas tu canasta.",
    oscuro: false,
  },
  {
    titulo: "DELIVERY CONFIABLE",
    descripcion: "Cada jueves, puntuales y cuidadosos con tu pedido. Sin excusas ni demoras.",
    oscuro: false,
  },
];

export default function Principios() {
  return (
    <section className="bg-white py-24 px-9 md:px-[4.5rem]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center">

        {/* Imagen izquierda */}
        <div className="md:w-2/5 relative flex justify-center">
          <div className="w-72 h-80 md:w-80 md:h-96 rounded-3xl overflow-hidden shadow-xl">
            <Image src="/images/foto3.png" alt="Productos frescos" fill className="object-cover" />
          </div>
        </div>

        {/* Cards derecha */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="mb-4">
            <span className="font-pacifico text-[#F9C514] text-2xl">Cómo trabajamos</span>
            <h2 className="font-nunito font-black text-[#1A1A1A] text-4xl md:text-5xl leading-tight mt-1">
              NUESTROS PRINCIPIOS
            </h2>
          </div>

          {principios.map((p) => (
            <div
              key={p.titulo}
              className={`rounded-3xl p-6 ${p.oscuro ? "bg-[#1A5C18]" : "bg-[#f9fafb]"}`}
            >
              <h3 className={`font-nunito font-black text-xl mb-2 ${p.oscuro ? "text-[#F9C514]" : "text-[#1A1A1A]"}`}>
                {p.titulo}
              </h3>
              <p className={p.oscuro ? "text-white/75 text-sm" : "text-[#666666] text-sm"}>
                {p.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
