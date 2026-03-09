// File upload is now handled via /api/upload route using AppWrite Storage.
// Client-side upload helper for convenience:

export async function uploadFile(file: File): Promise<string | undefined> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) return undefined;
  const data = (await res.json()) as { url: string };
  return data.url;
}
