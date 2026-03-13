"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [phase, setPhase] = useState<"iris-close" | "logo" | "iris-open" | "done">("iris-close");

  useEffect(() => {
    // Solo una vez por sesión
    if (sessionStorage.getItem("splash_shown")) {
      setPhase("done");
      return;
    }

    // Fase 1: iris se cierra (700ms)
    const t1 = setTimeout(() => setPhase("logo"), 700);
    // Fase 2: logo visible (800ms pausa)
    const t2 = setTimeout(() => setPhase("iris-open"), 1500);
    // Fase 3: iris se abre (700ms) → done
    const t3 = setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("splash_shown", "1");
    }, 2200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "all",
        backgroundColor: "#3AAA35",
        clipPath:
          phase === "iris-close"
            ? undefined
            : phase === "iris-open"
            ? undefined
            : "circle(0% at 50% 50%)",
        animation:
          phase === "iris-close"
            ? "iris-close 0.7s cubic-bezier(0.4,0,0.2,1) forwards"
            : phase === "iris-open"
            ? "iris-open 0.7s cubic-bezier(0.4,0,0.2,1) forwards"
            : "none",
      }}
    >
      {/* Logo */}
      {(phase === "logo" || phase === "iris-open") && (
        <div
          style={{
            animation:
              phase === "logo"
                ? "logo-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards"
                : "logo-out 0.35s ease-in forwards",
          }}
        >
          <Image
            src="/icon.png"
            alt="Frescon"
            width={140}
            height={140}
            priority
          />
        </div>
      )}
    </div>
  );
}
