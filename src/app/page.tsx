export const revalidate = 60;

import Hero from "@/components/sections/Hero";
import Mision from "@/components/sections/Mision";
import Quienes from "@/components/sections/Quienes";
import PorQueElegirnos from "@/components/sections/PorQueElegirnos";
import Vision from "@/components/sections/Vision";
import Principios from "@/components/sections/Principios";
import Catalogo from "@/components/sections/Catalogo";
import ComoFunciona from "@/components/sections/ComoFunciona";
import Cierre from "@/components/sections/Cierre";
import { getProductos } from "@/lib/airtable";

export default async function Home() {
  const productos = await getProductos();

  return (
    <main>
      <Hero />
      <Mision />
      <Quienes />
      <PorQueElegirnos />
      <Vision />
      <Principios />
      <Catalogo productos={productos} />
      <ComoFunciona />
      <Cierre />
    </main>
  );
}
