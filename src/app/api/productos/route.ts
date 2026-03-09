import { NextResponse } from "next/server";
import { getProductos } from "@/lib/airtable";

export const revalidate = 60; // caché 60 segundos

export async function GET() {
  try {
    const productos = await getProductos();
    return NextResponse.json(productos);
  } catch (err) {
    console.error("Error fetching productos:", err);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}
