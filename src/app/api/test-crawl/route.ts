import { NextResponse } from "next/server";

export async function GET() {
    try {
        const res = await fetch("https://www.msci.com/indexes/index/941000", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Fetch failed", status: res.status });
        }

        const html = await res.text();

        const constituentsText = html.substring(html.indexOf("Top 10 constituents"), html.indexOf("Top 10 constituents") + 2000);

        return NextResponse.json({
            success: true,
            htmlSnippet: constituentsText
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
