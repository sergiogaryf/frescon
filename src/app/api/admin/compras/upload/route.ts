import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file     = form.get("file") as File | null;
    const recordId = form.get("recordId") as string | null;

    if (!file || !recordId) {
      return NextResponse.json({ error: "file y recordId requeridos" }, { status: 400 });
    }

    const baseId = process.env.AIRTABLE_BASE_ID!;
    const token  = process.env.AIRTABLE_API_KEY!;

    // Upload directo a Airtable Content API
    const uploadForm = new FormData();
    uploadForm.append("file", file, file.name);

    const res = await fetch(
      `https://content.airtable.com/v0/${baseId}/${recordId}/boleta_url/uploadAttachment`,
      {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    uploadForm,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Airtable upload error:", res.status, err);
      return NextResponse.json({ error: "Error al subir a Airtable" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
