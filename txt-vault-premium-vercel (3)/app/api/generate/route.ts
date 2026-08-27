import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const stockDir = path.join(process.cwd(), "public", "stock");
  try {
    const entries = await fs.readdir(stockDir, { withFileTypes: true });
    const files = entries.filter(e => e.isFile() && e.name.toLowerCase().endsWith(".txt")).map(e => e.name);
    if (!files.length) return NextResponse.json({ error: "Aucun fichier .txt dans public/stock." }, { status: 404 });

    const file = files[Math.floor(Math.random() * files.length)];
    const url = `/stock/${encodeURIComponent(file)}`;
    return NextResponse.json({
      file,
      links: [url, `${url}?link=2`],
      preview: url
    });
  } catch {
    return NextResponse.json({ error: "Impossible de lire le stock." }, { status: 500 });
  }
}
