import { NextRequest, NextResponse } from "next/server";
import { generateMemeImage } from "@/lib/flux";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const prompt = body.prompt;

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Meme prompt is required",
                },
                { status: 400 }
            );
        }

        console.log("Generating FLUX meme...");

        const imageBlob = await generateMemeImage(prompt);

        const arrayBuffer = await imageBlob.arrayBuffer();

        const base64 = Buffer.from(arrayBuffer).toString("base64");

        console.log("FLUX image generated successfully");

        return NextResponse.json({
            success: true,
            image: `data:image/png;base64,${base64}`,
        });

    } catch (error) {
        console.error("FLUX ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to generate meme",
            },
            { status: 500 }
        );
    }
}