import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";


const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function POST(req: NextRequest) {
  // Create the client per request: `new Resend()` throws when the key is
  // missing, and doing that at module load breaks `next build`.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[send-email] RESEND_API_KEY is not set");
    return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
  }
  const resend = new Resend(apiKey);

  const body = await req.json();
  const { to, country, honeypot } = body;

  // Bot trap
  if (honeypot) return NextResponse.json({ ok: true });

  // `to` = Trade Owner Email ID entered on the Product Summary page
  if (!to) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  const baseUrl = (process.env.APP_URL || req.nextUrl.origin).replace(
    /\/$/,
    "",
  );
  const params = new URLSearchParams({ email: to });
  if (typeof country === "string" && country) params.set("country", country);
  const uploadUrl = `${baseUrl}/upload-documents?${params}`;

  const { error } = await resend.emails.send({
    from: "CuraLex Document Form <hello@krylox.ai>",
    to,
    subject: "Upload your NAFDAC registration documents",
    text: [
      "Hello,",
      "",
      "Please upload the documents required for your product registration using the link below:",
      uploadUrl,
      "",
      "Thank you.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f1b4c;max-width:520px">
        <p>Hello,</p>
        <p>Please upload the documents required for your product registration with NAFDAC.</p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(uploadUrl)}"
             style="background:#058fc2;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">
            Upload Documents
          </a>
        </p>
        <p>Thank you</p>
      </div>`,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
