"use client";

import { useState } from "react";

export default function MemeTestPage() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateMeme() {
    setLoading(true);
    setImage(null);
    setError("");

    try {
      const response = await fetch("/api/meme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt:
            "A hilarious Indian engineering college student staring at a laptop in complete confusion while trying to understand recursion, exaggerated confused facial expression, computer science classroom, funny educational programming meme, humorous situation, cinematic lighting, high quality",
        }),
      });

      const data = await response.json();

      console.log("API response:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate meme");
      }

      setImage(data.image);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-10">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-bold mb-4">
          FLUX Meme Test
        </h1>

        <p className="mb-6">
          Test whether FLUX.1-schnell is working.
        </p>

        <button
          onClick={generateMeme}
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-black text-white disabled:opacity-50"
        >
          {loading ? "Generating Meme..." : "Generate Meme"}
        </button>

        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-100 text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {image && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">
              Generated Meme
            </h2>

            <img
              src={image}
              alt="Generated meme"
              className="w-full rounded-xl shadow-lg"
            />
          </div>
        )}

      </div>
    </main>
  );
}   