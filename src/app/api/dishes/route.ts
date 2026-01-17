import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        // This might happen if session exists but user deleted or Adapter issue? 
        // Usually adapter creates user.
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dishes = await prisma.dish.findMany({
        where: { userId: user.id },
        orderBy: [
            { date: "asc" },
            { order: "asc" }
        ],
    });

    return NextResponse.json(dishes);
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, link, date } = body;

    let image = body.image;

    if (!image) {
        if (link) {
            // Priority 0: YouTube Thumbnail
            const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
            const youtubeMatch = link.match(youtubeRegex);
            if (youtubeMatch && youtubeMatch[1]) {
                image = `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
            }

            if (!image) {
                // Check if link is from a difficult source (TikTok, Instagram, Facebook)
                // These sites often fail scraping or return login pages.
                // We skip scraping for them to fall back to Google Search (Priority 1)
                const isDiffSource = /tiktok\.com|instagram\.com|facebook\.com/i.test(link);

                if (!isDiffSource) {
                    try {
                        // Attempt to fetch the link and extract og:image
                        // Using a simple fetch and regex to avoid heavy dependencies like cheerio/puppeteer
                        const res = await fetch(link, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } });
                        const html = await res.text();
                        const match = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
                        if (match && match[1]) {
                            image = match[1];
                        }
                    } catch (e) {
                        console.error("Failed to fetch link preview", e);
                    }
                }
            }
        }

        if (!image) {
            // Priority 1: Google Custom Search (Real images)
            const googleKey = process.env.GOOGLE_API_KEY;
            const googleCx = process.env.GOOGLE_SEARCH_CX;

            if (googleKey && googleCx) {
                try {
                    const query = `${name} food meal recipe high resolution`;
                    const googleRes = await fetch(`https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${googleCx}&key=${googleKey}&searchType=image&num=1&imgSize=medium&safe=active`);

                    if (googleRes.ok) {
                        const data = await googleRes.json();
                        if (data.items && data.items.length > 0) {
                            image = data.items[0].link;
                        }
                    }
                } catch (e) {
                    console.error("Google Search failed", e);
                }
            }
        }

        if (!image) {
            // Fallback to LoremFlickr (Real Stock Images)
            // Pollinations AI was returning error images (robots) for some queries/users.
            // LoremFlickr provides real stock photos based on keywords.
            // We use just the first word (likely the main ingredient/dish type) + "food" to ensure matches.
            // Too many specific keywords cause 404s.
            const firstWord = name.split(" ")[0].replace(/[^a-zA-Z]/g, ""); // Clean special chars
            const random = Math.floor(Math.random() * 10000);
            image = `https://loremflickr.com/500/500/${encodeURIComponent(firstWord)},food?random=${random}`;
        }
    }

    if (!name || !date) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dish = await prisma.dish.create({
        data: {
            name,
            link,
            image,
            date,
            userId: user.id,
        },
    });

    return NextResponse.json(dish);
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, link, date, order } = body;

    if (!id) {
        return NextResponse.json({ error: "Missing dish ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify dish belongs to user
    const existingDish = await prisma.dish.findUnique({
        where: { id },
    });

    if (!existingDish || existingDish.userId !== user.id) {
        return NextResponse.json({ error: "Dish not found or unauthorized" }, { status: 404 });
    }

    const updatedDish = await prisma.dish.update({
        where: { id },
        data: {
            name: name !== undefined ? name : undefined,
            link: link !== undefined ? link : undefined,
            date: date !== undefined ? date : undefined,
            order: order !== undefined ? order : undefined,
        },
    });

    return NextResponse.json(updatedDish);
}
