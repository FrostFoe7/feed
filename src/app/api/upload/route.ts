import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/server";
import { ID } from "node-appwrite";
import { STORAGE_BUCKET_ID } from "@/lib/appwrite/config";

export async function POST(req: NextRequest) {
  // Authenticate
  const sessionCookie = req.cookies.get("appwrite-session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { account } = createSessionClient(sessionCookie);
    await account.get(); // Verify session is valid
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 },
      );
    }

    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 4MB." },
        { status: 400 },
      );
    }

    const { storage } = createSessionClient(sessionCookie);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileId = ID.unique();
    const inputFile = new File([buffer], file.name, { type: file.type });

    await storage.createFile(STORAGE_BUCKET_ID, fileId, inputFile);

    const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

    return NextResponse.json({ url: fileUrl, fileId });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}
