import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    let images, month, year;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      images = body.images;
      month = body.month;
      year = body.year;
    } else {
      const formData = await req.formData();
      const dataStr = formData.get("data") as string;
      if (dataStr) {
        const data = JSON.parse(dataStr);
        images = data.images;
        month = data.month;
        year = data.year;
      }
    }

    if (!images || !Array.isArray(images)) {
      return new Response("No images provided", { status: 400 });
    }

    const pdfDoc = await PDFDocument.create();

    // Page Settings: 8.5 x 13 inches (Folio/Long) Landscape
    const pageWidth = 936;
    const pageHeight = 612;

    for (const imageBase64 of images) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Embed Image
      const imageBytes = Buffer.from(imageBase64.split(',')[1], 'base64');
      const image = await pdfDoc.embedPng(imageBytes);
      
      // Fit chart to maximum possible size on the page (no margins)
      const dims = image.scaleToFit(pageWidth, pageHeight);
      
      // Center the image exactly on the page
      page.drawImage(image, {
        x: (pageWidth - dims.width) / 2,
        y: (pageHeight - dims.height) / 2,
        width: dims.width,
        height: dims.height
      });
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    console.error("[API] Graphs Report Error:", error);
    return new Response(error.message || "Internal server error", { status: 500 });
  }
}
