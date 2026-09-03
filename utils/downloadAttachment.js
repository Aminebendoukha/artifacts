// utils/downloadAttachment.js
import { TOKEN_KEY } from "../AuthProvider.jsx";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3001";

export async function downloadAttachment(fileUrl, fileName) {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error("No authentication token found.");
  }

  // Ensure we have an absolute URL
  const url = fileUrl.startsWith("http")
    ? fileUrl
    : `${API_BASE}${fileUrl.replace(/^\/+/, "/")}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Download failed with status ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (json.error) message = json.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName || "download";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up after a short delay to ensure download starts
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 100);
}