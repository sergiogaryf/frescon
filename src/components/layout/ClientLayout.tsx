"use client";

import CartSidebar from "@/components/cart/CartSidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CartSidebar />
    </>
  );
}
