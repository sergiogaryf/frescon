"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

interface Props {
  onError?: (msg: string) => void;
  onLoading?: (loading: boolean) => void;
}

export default function GoogleSignInButton({ onError, onLoading }: Props) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      onLoading?.(true);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        const data = await res.json();

        if (!res.ok) {
          onError?.(data.error || "Error al iniciar con Google");
          onLoading?.(false);
          return;
        }

        router.push("/cuenta");
      } catch {
        onError?.("Error de conexion");
        onLoading?.(false);
      }
    },
    [router, onError, onLoading]
  );

  useEffect(() => {
    if (!clientId) return;

    // Cargar script de Google Identity Services
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    function initializeGoogle() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        itp_support: true,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: buttonRef.current.offsetWidth,
        text: "signin_with",
        shape: "pill",
        locale: "es",
      });
    }

    if (existingScript) {
      initializeGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.head.appendChild(script);
    }
  }, [clientId, handleCredentialResponse]);

  if (!clientId) {
    return null; // No mostrar si no hay Client ID configurado
  }

  return <div ref={buttonRef} className="w-full flex justify-center" />;
}
