// This module is deprecated. File uploads are now handled via /api/upload route using AppWrite Storage.
// Keeping this file to prevent 404 on old routes.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Upload route has been moved to /api/upload" }, { status: 301 });
}

export async function POST() {
  return NextResponse.json({ message: "Upload route has been moved to /api/upload" }, { status: 301 });
}
