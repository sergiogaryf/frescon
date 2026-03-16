export const revalidate = 20;

import CatalogoCompleto from "@/components/sections/CatalogoCompleto";
import { getProductos } from "@/lib/airtable";

export const metadata = {
  title: "Productos — Frescon Delivery",
  description: "Verduras, frutas, hierbas y más. Frescos cada jueves.",
};

export default async function CatalogoPage() {
  const productos = await getProductos();
  return <CatalogoCompleto productos={productos} />;
}
