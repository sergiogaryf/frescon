import { NextRequest, NextResponse } from "next/server";
import { postPhoto, postReel, postCarousel } from "@/lib/instagram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, imageUrl, imageUrls, videoUrl, caption } = body;

    if (!caption) {
      return NextResponse.json({ success: false, error: "Falta caption" }, { status: 400 });
    }

    let result;

    switch (type) {
      case "photo":
        if (!imageUrl) return NextResponse.json({ success: false, error: "Falta imageUrl" }, { status: 400 });
        result = await postPhoto(imageUrl, caption);
        break;

      case "reel":
        if (!videoUrl) return NextResponse.json({ success: false, error: "Falta videoUrl" }, { status: 400 });
        result = await postReel(videoUrl, caption);
        break;

      case "carousel":
        if (!imageUrls || imageUrls.length < 2) return NextResponse.json({ success: false, error: "Carousel requiere al menos 2 imageUrls" }, { status: 400 });
        result = await postCarousel(imageUrls, caption);
        break;

      default:
        return NextResponse.json({ success: false, error: "type debe ser: photo, reel o carousel" }, { status: 400 });
    }

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
