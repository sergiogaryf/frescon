import Image from "next/image";

const pasos = [
  {
    numero: "01",
    titulo: "Elige tus productos",
    descripcion: "Navega nuestro catálogo, agrega lo que necesitas al carrito y arma tu canasta ideal.",
    oscuro: true,
  },
  {
    numero: "02",
    titulo: "Completa tu pedido",
    descripcion: "Ingresa tus datos de entrega, elige el jueves que prefieres y confirma tu pago por transferencia.",
    oscuro: false,
  },
  {
    numero: "03",
    titulo: "Recibe en tu puerta",
    descripcion: "Cada jueves te llevamos tus verduras y frutas frescas, directo a la puerta de tu casa.",
    oscuro: true,
  },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="bg-white py-24 px-9 md:px-[4.5rem]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-start">

        {/* Título izquierda */}
        <div className="md:w-1/3">
          <span className="font-pacifico text-[#F9C514] text-2xl">Tres pasos</span>
          <h2 className="font-nunito font-black text-[#1A1A1A] text-4xl md:text-6xl leading-tight mt-2 mb-6">
            ¿CÓMO FUNCIONA?
          </h2>
          <p className="text-[#666666] leading-relaxed">
            Pedir tus verduras y frutas frescas es simple, rápido y sin sorpresas.
          </p>
        </div>

        {/* Imagen centro con profundidad */}
        <div className="hidden md:flex flex-1 justify-center items-center relative h-80">
          <div className="w-44 h-64 rounded-3xl overflow-hidden shadow-xl">
            <Image src="/images/foto2.png" alt="Pedido Frescon" fill className="object-cover" />
          </div>
        </div>

        {/* Pasos derecha */}
        <div className="md:w-2/5 flex flex-col gap-5">
          {pasos.map((paso) => (
            <div
              key={paso.numero}
              className={`rounded-3xl p-6 flex gap-5 items-start ${paso.oscuro ? "bg-[#2A7A26]" : "bg-[#f9fafb]"}`}
            >
              <span className={`font-nunito font-black text-4xl leading-none flex-shrink-0 ${paso.oscuro ? "text-white" : "text-[#1A1A1A]"}`}>
                {paso.numero}
              </span>
              <div>
                <h3 className={`font-nunito font-black text-lg mb-1 ${paso.oscuro ? "text-[#F9C514]" : "text-[#1A1A1A]"}`}>
                  {paso.titulo}
                </h3>
                <p className={`text-sm ${paso.oscuro ? "text-white/75" : "text-[#666666]"}`}>
                  {paso.descripcion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
