import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Store submissions in a JSON file on the server
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "submissions.json");

function readSubmissions(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSubmission(entry: any): void {
  const submissions = readSubmissions();
  submissions.push(entry);
  fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2), "utf8");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txid, tarAddress, name, btcSender, email } = body;

    // Basic validation
    if (!txid || !tarAddress) {
      return NextResponse.json(
        { error: "TXID and TAR address are required." },
        { status: 400 }
      );
    }

    const entry = {
      id: Date.now(),
      txid: txid.trim(),
      tarAddress: tarAddress.trim(),
      btcSender: btcSender?.trim() || "",
      name: name?.trim() || "Anonymous",
      email: email?.trim() || "",
      submittedAt: new Date().toISOString(),
    };

    saveSubmission(entry);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Submission error:", err);
    return NextResponse.json(
      { error: "Failed to save submission. Please try again." },
      { status: 500 }
    );
  }
}

// GET — view all submissions (protected by secret key)
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const adminKey = process.env.ADMIN_KEY || "tarcoin-admin-2026";

  if (key !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissions = readSubmissions();
  return NextResponse.json({
    total: submissions.length,
    submissions,
  });
}
