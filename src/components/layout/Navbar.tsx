"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";

interface NavbarProps {
  /** Si es true el fondo es transparente (sobre el hero). Si es false, fondo verde sólido */
  transparent?: boolean;
}

export default function Navbar({ transparent = false }: NavbarProps) {
  const toggleCart = useCartStore((s) => s.toggleCart);
  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.cantidad, 0)
  );

  return (
    <nav
      className={`relative z-30 flex items-center justify-between px-9 md:px-[4.5rem] py-2 md:py-5 ${
        transparent ? "" : "bg-[#2A7A26] shadow-md"
      }`}
    >
      <Link href="/">
        <Image
          src="/images/Logo.png"
          alt="Frescon Delivery"
          width={160}
          height={70}
          className="object-contain drop-shadow-lg"
          priority
        />
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/catalogo"
          className="text-white font-nunito font-bold hover:text-[#F9C514] transition-colors text-sm hidden md:block drop-shadow"
        >
          Productos
        </Link>
        <Link
          href="/#como-funciona"
          className="text-white font-nunito hover:text-[#F9C514] transition-colors text-sm hidden md:block drop-shadow"
        >
          ¿Cómo funciona?
        </Link>
        <Link
          href="/cuenta"
          className="text-white font-nunito hover:text-[#F9C514] transition-colors text-sm hidden md:flex items-center gap-1.5 drop-shadow"
          title="Mi cuenta y referidos"
        >
          <UserIcon />
          Mi cuenta
        </Link>

        <button
          onClick={toggleCart}
          className="relative flex items-center gap-2 bg-[#F9C514] hover:bg-[#E0B010] text-[#1A1A1A] font-nunito font-black text-sm px-4 py-2 rounded-full transition-colors"
        >
          <CartIcon />
          <span>Mi pedido</span>
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#1A5C18] text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center leading-none">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
