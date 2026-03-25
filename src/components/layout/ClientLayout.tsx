"use client";

import { usePathname } from "next/navigation";
import CartSidebar from "@/components/cart/CartSidebar";
import PromoPopup from "@/components/PromoPopup";
import ChatWidget from "@/components/chat/ChatWidget";
import UrgencyBanner from "@/components/UrgencyBanner";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin  = pathname?.startsWith("/admin") || pathname?.startsWith("/repartidor");
  const isCheckoutFlow = pathname === "/checkout" || pathname === "/confirmacion";

  return (
    <>
      {!isAdmin && !isCheckoutFlow && <UrgencyBanner />}
      {children}
      {!isAdmin && <CartSidebar />}
      {!isAdmin && <PromoPopup />}
      <ChatWidget />
    </>
  );
}
