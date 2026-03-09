import Image from "next/image";

export default function Cierre() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "56912345678";

  return (
    <section className="bg-[#1A5C18] py-24 px-9 md:px-[4.5rem] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-[#2A7A26] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#3AAA35]/30 rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">

        {/* Logo + texto izquierda */}
        <div className="flex-1">
          <div className="mb-4">
            <Image
              src="/images/Logo.png"
              alt="Frescon Delivery"
              width={180}
              height={80}
              className="object-contain brightness-0 invert"
            />
          </div>

          {/* Móvil: "¡PIDE HOY!" con imagen flotando al lado derecho */}
          <div className="relative md:block">
            <div className="font-nunito font-black leading-none">
              <div className="text-white text-6xl md:text-8xl">¡PIDE</div>
              <div className="text-[#F9C514] text-6xl md:text-8xl">HOY!</div>
            </div>
            {/* Imagen absoluta en móvil — flota sobre las letras sin afectar layout */}
            <div className="md:hidden absolute -top-20 -right-8 z-10 pointer-events-none">
              <Image
                src="/images/elemento1.png"
                alt="Canasta Frescon"
                width={230}
                height={230}
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <p className="text-white/70 text-lg mt-6 max-w-md">
            Cada jueves llevamos lo más fresco directamente a tu puerta.
            No te quedes sin tu canasta de la semana.
          </p>
        </div>

        {/* Imagen + CTA derecha — solo desktop */}
        <div className="hidden md:flex flex-col items-center gap-6">
          <Image
            src="/images/elemento1.png"
            alt="Canasta Frescon"
            width={300}
            height={300}
            className="object-contain drop-shadow-2xl"
          />
          <a
            href="/catalogo"
            className="bg-[#F9C514] hover:bg-[#E0B010] text-[#1A1A1A] font-nunito font-black text-xl px-10 py-5 rounded-full transition-colors text-center w-full"
          >
            Ver productos →
          </a>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-white/40 hover:border-white text-white font-nunito font-bold text-lg px-10 py-4 rounded-full transition-colors text-center w-full flex items-center justify-center gap-2"
          >
            <WhatsAppIcon />
            Escríbenos
          </a>
          <p className="text-white/40 text-sm">www.frescon.cl</p>
        </div>

        {/* Botones solo móvil */}
        <div className="md:hidden w-full flex flex-col gap-4">
          <a
            href="/catalogo"
            className="bg-[#F9C514] text-[#1A1A1A] font-nunito font-black text-xl px-10 py-5 rounded-full text-center"
          >
            Ver productos →
          </a>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-white/40 text-white font-nunito font-bold text-lg px-10 py-4 rounded-full text-center flex items-center justify-center gap-2"
          >
            <WhatsAppIcon />
            Escríbenos
          </a>
          <p className="text-white/40 text-sm text-center">www.frescon.cl</p>
        </div>
      </div>
    </section>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
