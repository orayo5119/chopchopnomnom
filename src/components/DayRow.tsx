"use client";

import { useRef, useState } from "react";
import { motion, Reorder } from "framer-motion";
import styles from "./DayRow.module.css";
import { PasteIcon } from "./Icons";

interface DayRowProps {
    date: Date;
    dayName: string;
    dishes?: any[]; // Replace with Dish type later
    onAddDish: () => void;
    onDishClick?: (dish: any, layoutId: string) => void;
    onMoveDish?: (dishId: string, newDate: Date) => void;
    onDishLongPress?: (dish: any) => void;
    isSelected?: boolean;
    onSelect?: () => void;
    onReorder?: (newDishes: any[]) => void;
    isDragTarget?: boolean;
    onDragOverChange?: (date: Date | null) => void;
}

export default function DayRow({ date, dayName, dishes = [], onAddDish, onDishClick, onMoveDish, onDishLongPress, isSelected, onSelect, onReorder, isDragTarget, onDragOverChange }: DayRowProps) {
    const formattedDate = date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [showShadow, setShowShadow] = useState(false);

    const handleScroll = () => {
        if (sliderRef.current) {
            setShowShadow(sliderRef.current.scrollLeft > 0);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only trigger drag scroll if not clicking on interactive elements
        // (Though events usually bubble, we might want to be careful)
        // Also if we want row selection on click, we should handle click
        // Check if target is a Reorder item (button) or inside it?
        // Actually Reorder grab stops propagation?
        // If user drags the background, we scroll.
        if ((e.target as HTMLElement).closest('button')) return;

        setIsDown(true);
        if (sliderRef.current) {
            setStartX(e.pageX - sliderRef.current.offsetLeft);
            setScrollLeft(sliderRef.current.scrollLeft);
        }
    };

    const handleMouseLeave = () => {
        setIsDown(false);
    };

    const handleMouseUp = () => {
        setIsDown(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown) return;
        e.preventDefault();
        if (sliderRef.current) {
            const x = e.pageX - sliderRef.current.offsetLeft;
            const walk = (x - startX) * 2; // scroll-fast
            if (Math.abs(walk) > 5) {
                // Consider it a drag, maybe prevent click?
            }
            sliderRef.current.scrollLeft = scrollLeft - walk;
        }
    };

    const handleRowClick = (e: React.MouseEvent) => {
        // If clicking on background (and not dragging), select row
        if (onSelect && !(e.target as HTMLElement).closest('button')) {
            onSelect();
        }
    };

    // Drag and Drop Handlers (Native HTML5 for receiving external drops, if needed)
    const [isDragOver, setIsDragOver] = useState(false);
    const isDraggingRef = useRef(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Allow drop
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const dishId = e.dataTransfer.getData("dishId");
        // Only handle if it comes from existing HTML5 drag logic (fallback)
        if (dishId && onMoveDish) {
            onMoveDish(dishId, date);
        }
    };

    // Reorder Handlers
    const handleReorder = (newOrder: any[]) => {
        // Optimistic update handled by local state of Reorder.Group?
        // We need to propagate up.
        if (onReorder) {
            onReorder(newOrder);
        }
    };

    // Track internal drag state for z-index and overflow
    const [isInternalDragging, setIsInternalDragging] = useState(false);
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

    const handleItemDragStart = () => {
        isDraggingRef.current = true;
        if (sliderRef.current) {
            setContainerSize({
                width: sliderRef.current.offsetWidth,
                height: sliderRef.current.offsetHeight
            });
        }
        setIsInternalDragging(true);
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleItemDragMove = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
        if (!onDragOverChange) return;

        const point = info.point;
        const elements = document.elementsFromPoint(point.x, point.y);
        const targetRow = elements.find(el => el.hasAttribute('data-day-row'));

        if (targetRow) {
            const targetDateStr = targetRow.getAttribute('data-date');
            if (targetDateStr) {
                onDragOverChange(new Date(targetDateStr));
            }
        } else {
            onDragOverChange(null);
        }
    };

    const handleItemDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: any, dish: any) => {
        setIsInternalDragging(false);
        setContainerSize(null);
        if (onDragOverChange) onDragOverChange(null);

        // Reset dragging status with a small delay to prevent onClick from firing immediately after drag
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);

        // Check if dropped on another day
        // We use client coordinates
        // MouseEvent/PointerEvent has clientX/Y.
        // info.point.x/y provided by framer
        const point = info.point;

        // Hide the dragged element momentarily to find what's underneath?
        // Or assume elementFromPoint works.
        // Elements from point is safer
        const elements = document.elementsFromPoint(point.x, point.y);
        const targetRow = elements.find(el => el.hasAttribute('data-day-row'));

        if (targetRow) {
            const targetDateStr = targetRow.getAttribute('data-date');
            if (targetDateStr && targetDateStr !== date.toISOString()) {
                // Moved to another day
                if (onMoveDish) {
                    onMoveDish(dish.id, new Date(targetDateStr));
                }
            }
        }
    };

    // Long Press Handlers
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const handleTouchStart = (dish: any) => {
        isDraggingRef.current = false; // Reset potential stale state
        longPressTimer.current = setTimeout(() => {
            if (onDishLongPress && !isDraggingRef.current) onDishLongPress(dish);
        }, 2500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // For mouse users who might "click and hold"
    const handleMouseDownDish = (e: React.MouseEvent, dish: any) => {
        isDraggingRef.current = false;
        longPressTimer.current = setTimeout(() => {
            if (onDishLongPress && !isDraggingRef.current) onDishLongPress(dish);
        }, 2500);
    };

    const handleDishClick = (dish: any, layoutId: string) => {
        if (!isDraggingRef.current && onDishClick) {
            onDishClick(dish, layoutId);
        }
    };

    return (
        <div
            className={`${styles.row} ${isDragOver ? styles.dragOver : ""} ${isSelected ? styles.selected : ""} ${isDragTarget ? styles.dragTarget : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleRowClick}
            data-day-row="true"
            data-date={date.toISOString()}
            style={{
                zIndex: isInternalDragging ? 999 : 1,
                position: 'relative'
            }}
        >
            <div className={styles.header}>
                <span className={`${styles.dayName} ${dayName === "Sun" ? styles.sundayText : ""}`}>{dayName}</span>
                <span className={styles.date}>{formattedDate}</span>
            </div>
            <div className={styles.scrollWrapper}>
                {isDragTarget && (
                    <div className={styles.dropZoneOverlay}>
                        + Drop zone for {dayName}
                    </div>
                )}
                <div
                    className={`${styles.scrollShadow} ${showShadow ? styles.visible : ""}`}
                />
                <div
                    className={styles.dishesContainer}
                    ref={sliderRef}
                    onScroll={handleScroll}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    style={{
                        cursor: isDown ? 'grabbing' : 'grab',
                        overflow: isInternalDragging ? 'visible' : undefined,
                        width: containerSize ? containerSize.width : undefined,
                        height: containerSize ? containerSize.height : undefined,
                        flexGrow: containerSize ? 0 : 1 // Prevent flex from overriding width if needed
                    }}
                >
                    {isSelected ? (
                        <button className={styles.pasteButton} onClick={(e) => {
                            e.stopPropagation();
                            onAddDish();
                        }} aria-label={`Paste dish to ${dayName}`}>
                            <PasteIcon /> Paste
                        </button>
                    ) : (
                        <button className={styles.addButton} onClick={(e) => {
                            e.stopPropagation();
                            onAddDish();
                        }} aria-label={`Add dish to ${dayName}`}>
                            +
                        </button>
                    )}

                    <Reorder.Group
                        axis="x"
                        values={dishes}
                        onReorder={handleReorder}
                        className={styles.reorderGroup}
                        as="div"
                    >
                        {dishes.map((dish, idx) => {
                            const layoutId = `dish-${dish.id || `${dayName}-${idx}`}`;
                            return (
                                <Reorder.Item
                                    key={dish.id || idx}
                                    value={dish}
                                    className={styles.dish}
                                    layoutId={layoutId} // Framer Reorder uses layoutId for position
                                    onClick={() => handleDishClick(dish, layoutId)}
                                    // Drag end handler for cross-day
                                    drag
                                    onDragStart={handleItemDragStart}
                                    onDrag={handleItemDragMove}
                                    onDragEnd={(event, info) => handleItemDragEnd(event, info, dish)}

                                    // Long press
                                    onTouchStart={() => handleTouchStart(dish)}
                                    onTouchEnd={handleTouchEnd}
                                    onMouseDown={(e: React.MouseEvent) => handleMouseDownDish(e, dish)}
                                    onMouseUp={handleTouchEnd}
                                    onMouseLeave={handleTouchEnd}
                                    onContextMenu={(e: React.MouseEvent) => {
                                        if (onDishLongPress) e.preventDefault();
                                    }}

                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    // Ensure it doesn't default to li
                                    as="button"
                                // Remove native draggable
                                >
                                    {dish.image && (
                                        <img
                                            src={dish.image}
                                            alt={dish.name}
                                            className={styles.dishImage}
                                            onError={(e) => {
                                                e.currentTarget.src = "https://loremflickr.com/500/500/food,meal";
                                                e.currentTarget.onerror = null;
                                            }}
                                        />
                                    )}
                                    <motion.span layoutId={`${layoutId}-text`}>
                                        {dish.name}
                                    </motion.span>
                                </Reorder.Item>
                            );
                        })}
                    </Reorder.Group>
                </div>
            </div>
        </div>
    );
}
