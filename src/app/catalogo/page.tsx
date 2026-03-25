export const revalidate = 20;

import CatalogoCompleto from "@/components/sections/CatalogoCompleto";
import { getProductos, getPerfilCliente } from "@/lib/airtable";

export const metadata = {
  title: "Productos — Frescon Delivery",
  description: "Verduras, frutas, hierbas y más. Frescos cada jueves.",
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ tel?: string }>;
}) {
  const params = await searchParams;
  const productos = await getProductos();

  // Si viene ?tel=, buscar perfil y extraer favoritos
  let favoritos: string[] = [];
  if (params.tel) {
    const perfil = await getPerfilCliente(params.tel);
    if (perfil?.productos_favoritos) {
      favoritos = perfil.productos_favoritos.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
  }

  return <CatalogoCompleto productos={productos} favoritos={favoritos} />;
}
