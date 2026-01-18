
import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({ message: "pong", time: new Date().toISOString() });
}
