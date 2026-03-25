import type jsPDF from "jspdf";

export async function loadLogoBase64(): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = "/icon.png";
  });
}

export function drawHeader(doc: jsPDF, title: string, subtitle?: string) {
  const W = doc.internal.pageSize.getWidth();
  const logo = (doc as unknown as { _fresconLogo?: string })._fresconLogo;

  doc.setFillColor(58, 170, 53);
  doc.rect(0, 0, W, 38, "F");

  if (logo) doc.addImage(logo, "PNG", 12, 6, 26, 26);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("FRESCON", 42, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Delivery", 42, 28);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, W - 15, 20, { align: "right" });

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, W - 15, 28, { align: "right" });
  }
}

export function drawFooter(doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth();
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(15, footerY, W - 15, footerY);
  doc.setTextColor(153, 153, 153);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Frescon Delivery | frescon.cl | Del Valle de Aconcagua a tu mesa", W / 2, footerY + 6, { align: "center" });
}

export function fmt(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

export async function initPdf(title: string, subtitle?: string) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const logo = await loadLogoBase64();
  (doc as unknown as { _fresconLogo?: string })._fresconLogo = logo;
  drawHeader(doc, title, subtitle);
  return doc;
}
