"use client";

import CartSidebar from "@/components/cart/CartSidebar";
import PromoPopup from "@/components/PromoPopup";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CartSidebar />
      <PromoPopup />
    </>
  );
}
