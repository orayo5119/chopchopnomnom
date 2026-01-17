
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date"); // e.g. "2025-12-28"

    if (!dateStr) {
        return NextResponse.json({ error: "Date required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const weekStartDate = new Date(dateStr);

    const note = await prisma.weeklyNote.findUnique({
        where: {
            userId_weekStartDate: {
                userId: user.id,
                weekStartDate: weekStartDate,
            },
        },
    });

    return NextResponse.json(note || { content: "" });
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, content } = body;

    if (!date) {
        return NextResponse.json({ error: "Date required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const weekStartDate = new Date(date);

    // Upsert the note
    const note = await prisma.weeklyNote.upsert({
        where: {
            userId_weekStartDate: {
                userId: user.id,
                weekStartDate: weekStartDate,
            },
        },
        update: {
            content: content || "",
        },
        create: {
            userId: user.id,
            weekStartDate: weekStartDate,
            content: content || "",
        },
    });

    return NextResponse.json(note);
}
