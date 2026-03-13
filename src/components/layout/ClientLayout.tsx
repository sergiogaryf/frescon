"use client";

import { usePathname } from "next/navigation";
import CartSidebar from "@/components/cart/CartSidebar";
import PromoPopup from "@/components/PromoPopup";
import ChatWidget from "@/components/chat/ChatWidget";
import SplashScreen from "@/components/SplashScreen";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin  = pathname?.startsWith("/admin") || pathname?.startsWith("/repartidor");

  return (
    <>
      {!isAdmin && <SplashScreen key={pathname} />}
      {children}
      {!isAdmin && <CartSidebar />}
      {!isAdmin && <PromoPopup />}
      <ChatWidget />
    </>
  );
}
