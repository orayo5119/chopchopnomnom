"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./SingleDayView.module.css";

interface SingleDayViewProps {
    date: Date;
    dish: {
        id: string;
        name: string;
        link?: string;
        image?: string;
    };
    dishes?: {
        id: string;
        name: string;
        link?: string;
        image?: string;
    }[];
    onBack: () => void;
}

export default function SingleDayView({ date, dish, dishes, onBack }: SingleDayViewProps) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const formattedDate = date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });

    // Safety check for dishes
    const dishList = dishes && dishes.length > 0 ? dishes : [dish];
    const isMulti = dishList.length > 1;

    // Track which dish is currently playing. Start with the one clicked.
    const [playingDishId, setPlayingDishId] = useState<string | null>(dish.id);

    // Ref for horizontal scrolling with mouse wheel and drag
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const dragInfo = useRef({
        isDown: false,
        startX: 0,
        scrollLeft: 0,
        totalMove: 0
    });

    // Header Drag Logic
    const headerListRef = useRef<HTMLDivElement>(null);
    const [isHeaderDown, setIsHeaderDown] = useState(false);
    const [headerStartX, setHeaderStartX] = useState(0);
    const [headerScrollLeft, setHeaderScrollLeft] = useState(0);
    const [showHeaderShadow, setShowHeaderShadow] = useState(false);

    // Drag Logic Helpers
    const headerDragDist = useRef(0);

    const handleHeaderScroll = () => {
        if (headerListRef.current) {
            setShowHeaderShadow(headerListRef.current.scrollLeft > 0);
        }
    };

    const handleHeaderMouseDown = (e: React.MouseEvent) => {
        setIsHeaderDown(true);
        setHeaderStartX(e.pageX);
        headerDragDist.current = 0;
        if (headerListRef.current) {
            setHeaderScrollLeft(headerListRef.current.scrollLeft);
        }
    };

    const handleHeaderMouseLeave = () => {
        setIsHeaderDown(false);
    };

    const handleHeaderMouseUp = () => {
        setIsHeaderDown(false);
    };

    const handleHeaderMouseMove = (e: React.MouseEvent) => {
        if (!isHeaderDown || !headerListRef.current) return;
        e.preventDefault();
        const x = e.pageX;
        const walk = (x - headerStartX) * 2; // scroll-fast like DayRow
        headerDragDist.current += Math.abs(x - headerStartX); // Track generic movement
        headerListRef.current.scrollLeft = headerScrollLeft - walk;
    };

    const handleChipClick = (targetDishId: string) => {
        // Prevent click if we were dragging the header
        if (headerDragDist.current > 5) return;

        setPlayingDishId(targetDishId);

        const container = scrollContainerRef.current;
        if (!container || !isMulti) return;

        const targetIndex = dishList.findIndex(d => d.id === targetDishId);
        if (targetIndex >= 0) {
            const firstChild = container.children[0] as HTMLElement;
            if (firstChild) {
                const cardWidth = firstChild.offsetWidth;
                const gap = 16;
                const targetScroll = targetIndex * (cardWidth + gap);
                container.scrollTo({
                    left: targetScroll,
                    behavior: "smooth"
                });
            }
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !isMulti) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return;
            // Translate vertical scroll to horizontal
            e.preventDefault();
            container.scrollLeft += e.deltaY;
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel);
    }, [isMulti]);

    // Initial Scroll to Clicked Dish (Instant)
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !isMulti) return;

        const targetIndex = dishList.findIndex(d => d.id === dish.id);
        if (targetIndex > 0) {
            // We need to wait for layout/render to ensure widths are correct
            // or just assume the first child exists.
            const firstChild = container.children[0] as HTMLElement;
            if (firstChild) {
                const cardWidth = firstChild.offsetWidth;
                const gap = 16; // from CSS
                const targetScroll = targetIndex * (cardWidth + gap);

                container.scrollTo({
                    left: targetScroll,
                    behavior: "instant" // Jump directly, don't animate on open
                });
            }
        }
    }, [dish.id, isMulti]); // Run when dish.id changes (initial open) or layout changes

    // Drag Handlers
    const onMouseDown = (e: React.MouseEvent) => {
        const container = scrollContainerRef.current;
        if (!container || !isMulti) return;

        dragInfo.current.isDown = true;
        dragInfo.current.startX = e.pageX - container.offsetLeft;
        dragInfo.current.scrollLeft = container.scrollLeft;
        dragInfo.current.totalMove = 0;

        // Disable scroll snap during drag for smoothness
        container.style.scrollSnapType = 'none';
        container.style.cursor = 'grabbing';
    };

    const onMouseLeave = () => {
        const container = scrollContainerRef.current;
        dragInfo.current.isDown = false;
        if (container) {
            container.style.scrollSnapType = 'x mandatory'; // Re-enable snap
            container.style.cursor = 'grab';
        }
    };

    const onMouseUp = () => {
        const container = scrollContainerRef.current;
        dragInfo.current.isDown = false;
        if (container) {
            container.style.scrollSnapType = 'x mandatory'; // Re-enable snap
            container.style.cursor = 'grab';
        }
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!dragInfo.current.isDown) return;
        e.preventDefault();

        const container = scrollContainerRef.current;
        if (!container) return;

        const x = e.pageX - container.offsetLeft;
        const walk = (x - dragInfo.current.startX) * 1.5; // Scroll-fast
        container.scrollLeft = dragInfo.current.scrollLeft - walk;

        dragInfo.current.totalMove += Math.abs(walk);
    };

    const onClickCapture = (e: React.MouseEvent) => {
        // If we dragged more than a tiny bit, block the click propogation
        if (dragInfo.current.totalMove > 5) {
            e.stopPropagation();
        }
    };

    return (
        <motion.div
            className={styles.singleDayContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className={styles.topStrip}>
                <div className={styles.contentRow}>
                    <div className={styles.dateColumn}>
                        <span className={styles.dayName}>{dayName}</span>
                        <span className={styles.date}>{formattedDate}</span>
                    </div>

                    <div className={styles.separator}></div>

                    <div className={styles.contentColumn}>
                        {/* Header shows list of all dishes for the day */}
                        <div
                            className={styles.headerScrollWrapper}
                            onMouseDown={handleHeaderMouseDown}
                            onMouseLeave={handleHeaderMouseLeave}
                            onMouseUp={handleHeaderMouseUp}
                            onMouseMove={handleHeaderMouseMove}
                            style={{ cursor: isHeaderDown ? 'grabbing' : 'grab' }}
                        >
                            <div
                                className={`${styles.headerScrollShadow} ${showHeaderShadow ? styles.visible : ""}`}
                            />
                            <div
                                className={styles.headerDishList}
                                ref={headerListRef}
                                onScroll={handleHeaderScroll}
                            >
                                {dishList.map((d) => (
                                    <div
                                        key={d.id}
                                        className={styles.headerChip}
                                        onClick={() => handleChipClick(d.id)}
                                    >
                                        {/* Thumbnail Removed */}
                                        <span className={styles.headerChipText}>{d.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.closeRow}>
                <button
                    className={styles.closeButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        onBack();
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div
                ref={scrollContainerRef}
                className={isMulti ? styles.multiVideoContainer : styles.videoContainer}
                onClick={(e) => e.stopPropagation()} // Prevent back click when interacting with scroll
                onClickCapture={isMulti ? onClickCapture : undefined}
                onMouseDown={isMulti ? onMouseDown : undefined}
                onMouseLeave={isMulti ? onMouseLeave : undefined}
                onMouseUp={isMulti ? onMouseUp : undefined}
                onMouseMove={isMulti ? onMouseMove : undefined}
            >
                {dishList.map((d) => (
                    <VideoCard
                        key={d.id}
                        dish={d}
                        isPlaying={playingDishId === d.id}
                        onPlay={() => setPlayingDishId(d.id)}
                    />
                ))}
            </div>
        </motion.div>
    );
}

function VideoCard({
    dish,
    isPlaying,
    onPlay
}: {
    dish: { id: string; name: string; link?: string; image?: string };
    isPlaying: boolean;
    onPlay: () => void;
}) {
    const hasLink = !!dish.link;

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        onPlay();
    };

    return (
        <div className={styles.videoWrapper}>
            <span className={styles.videoTitle}>{dish.name}</span>
            <div className={styles.phoneFrame}>
                {hasLink ? (
                    isPlaying ? (
                        <iframe
                            src={getEmbedUrl(dish.link!) + "&autoplay=1"} // Try to auto-play
                            className={styles.iframe}
                            scrolling="no"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <>
                            <div className={styles.thumbnail}>
                                <img
                                    src={dish.image}
                                    alt={dish.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${dish.name}&background=random&size=512`;
                                        e.currentTarget.onerror = null;
                                    }}
                                />
                            </div>
                            <div className={styles.playOverlay} onClick={handlePlay}>
                                <svg className={styles.playIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </>
                    )
                ) : (
                    <div className={styles.videoPlaceholder}>
                        <p>No video link provided</p>
                        <p style={{ fontSize: '0.8em', marginTop: 4 }}>{dish.name}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function getEmbedUrl(url: string): string {
    if (!url) return "";
    try {
        let finalUrl = url;
        let isYouTube = false;

        // YouTube Shorts
        if (url.includes("youtube.com/shorts/")) {
            const videoId = url.split("/shorts/")[1]?.split("?")[0];
            finalUrl = `https://www.youtube.com/embed/${videoId}`;
            isYouTube = true;
        }
        // YouTube Standard
        else if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const videoId = url.includes("v=") ? url.split("v=")[1]?.split("&")[0] : url.split("/").pop();
            finalUrl = `https://www.youtube.com/embed/${videoId}`;
            isYouTube = true;
        }
        // TikTok
        else if (url.includes("tiktok.com")) {
            const parts = url.split("/").filter(Boolean); // Remove empty strings from trailing slashes
            const lastPart = parts[parts.length - 1];
            const videoId = lastPart.split("?")[0];
            finalUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
        }
        // Instagram
        else if (url.includes("instagram.com/reel")) {
            finalUrl = `${url}embed`;
        }

        // Add query separator if needed
        const separator = finalUrl.includes("?") ? "&" : "?";

        // Append YouTube specific params for better UX (Controls, No Rel, etc.)
        if (isYouTube) {
            return `${finalUrl}${separator}controls=1&rel=0&modestbranding=1&playsinline=1&mute=1`;
        }

        // For TikTok and others, also try to append mute for better autoplay chance
        return `${finalUrl}${separator}mute=1`;
    } catch (e) {
        return url;
    }
}
