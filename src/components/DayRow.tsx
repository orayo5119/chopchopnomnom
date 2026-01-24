"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
    const activeDragElementRef = useRef<HTMLElement | null>(null);

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

    const dragOffsetY = useRef(0);
    const dragOffsetX = useRef(0); // For portal positioning

    // Drag Portal State
    const [draggingDishId, setDraggingDishId] = useState<string | null>(null);
    const [dragOverlay, setDragOverlay] = useState<{
        x: number;
        y: number;
        dish: any;
        width: number;
        height: number;
    } | null>(null);



    // Helper: Find the scrollable container
    const getScrollParent = (node: HTMLElement | null): HTMLElement => {
        if (!node) return document.documentElement;

        const overflowY = window.getComputedStyle(node).overflowY;
        const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';

        if (isScrollable && node.scrollHeight > node.clientHeight) {
            return node;
        }
        return getScrollParent(node.parentElement);
    };

    const getClientPoint = (event: MouseEvent | TouchEvent | PointerEvent) => {
        let clientX, clientY;
        if ((event as any).touches && (event as any).touches.length > 0) {
            clientX = (event as any).touches[0].clientX;
            clientY = (event as any).touches[0].clientY;
        } else if ((event as any).changedTouches && (event as any).changedTouches.length > 0) {
            clientX = (event as any).changedTouches[0].clientX;
            clientY = (event as any).changedTouches[0].clientY;
        } else {
            clientX = (event as any).clientX;
            clientY = (event as any).clientY;
        }
        return { x: clientX, y: clientY };
    }

    // Helper: Find the row whose vertical center is closest to the card's visual center (Container Coordinates)
    const findClosestDayRow = (cardCenterY_Container: number, container: HTMLElement): HTMLElement | null => {
        const rows = document.querySelectorAll('[data-day-row="true"]');
        let closestRow: HTMLElement | null = null;
        let minDistance = Infinity;

        // Container metrics
        const containerRect = container.getBoundingClientRect();
        const scrollTop = container.scrollTop;

        rows.forEach((row) => {
            const r = row as HTMLElement;
            const rect = r.getBoundingClientRect();

            // Row center in Container Coordinates
            const rowCenterY_Viewport = rect.top + (rect.height / 2);
            const rowCenterY_Container = rowCenterY_Viewport - containerRect.top + scrollTop;



            const distance = Math.abs(cardCenterY_Container - rowCenterY_Container);

            if (distance < minDistance) {
                minDistance = distance;
                closestRow = r;
            }
        });

        return closestRow;
    };


    const handleItemDragStart = (event: any, dish: any) => {
        isDraggingRef.current = true;
        // Capture the dragged element (the button)
        const target = event.target as HTMLElement;
        const buttonEl = target.closest('button') || target;
        activeDragElementRef.current = buttonEl;

        if (sliderRef.current) {
            setContainerSize({
                width: sliderRef.current.offsetWidth,
                height: sliderRef.current.offsetHeight
            });
        }
        setIsInternalDragging(true);

        // Calculate initial offset between Pointer and Card Center / TopLeft
        const { x: pointerX, y: pointerY } = getClientPoint(event);

        if (activeDragElementRef.current) {
            const rect = activeDragElementRef.current.getBoundingClientRect();
            // visual card center relative to viewport:
            const cardCenterY_Viewport = rect.top + rect.height / 2;

            // Offset for drop logic (center based)
            dragOffsetY.current = cardCenterY_Viewport - pointerY;

            // Offset for visual portal (top-left based)
            dragOffsetX.current = pointerX - rect.left;

            // Set Drag Overlay State
            setDraggingDishId(dish.id);
            setDragOverlay({
                x: rect.left,
                y: rect.top,
                dish: dish,
                width: rect.width,
                height: rect.height
            });
        }

        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleItemDragMove = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
        if (!activeDragElementRef.current) return; // Allow move updates for portal even if onDragOverChange missing? No, safety first.

        const { x: pointerX, y: pointerY } = getClientPoint(event);

        // 1. Update Portal Position
        if (dragOverlay) {
            setDragOverlay(prev => prev ? ({
                ...prev,
                x: pointerX - dragOffsetX.current,
                y: pointerY - (prev.height / 2) // Approximate Y centering or use offset? 
                // Actually better to use the same logic: offset from top
                // Let's use the captured offset to be precise
                // We didn't capture Y offset for top-left, we captured it for center.
                // Let's deduce top offset from center offset.
                // rect.top = center - height/2. 
                // center = pointer + dragOffsetY. 
                // So rect.top = (pointer + dragOffsetY) - height/2
            }) : null);

            // Refined Y calc for Portal based on center offset logic
            const currentCardCenterY_Viewport = pointerY + dragOffsetY.current;
            const renderTop = currentCardCenterY_Viewport - (dragOverlay.height / 2);

            setDragOverlay(prev => prev ? ({
                ...prev,
                x: pointerX - dragOffsetX.current,
                y: renderTop
            }) : null);
        }

        if (!onDragOverChange) return;

        // 2. Reconstruct Current Card Visual Center in Viewport
        const currentCardCenterY_Viewport = pointerY + dragOffsetY.current;

        // 3. Identify Scroll Container
        const container = getScrollParent(activeDragElementRef.current);
        const containerRect = container.getBoundingClientRect();
        const scrollTop = container.scrollTop;

        // 4. Convert Card Center to Container Coordinates
        const currentCardCenterY_Container = currentCardCenterY_Viewport - containerRect.top + scrollTop;

        const targetRow = findClosestDayRow(currentCardCenterY_Container, container);

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
        setDragOverlay(null);
        setDraggingDishId(null);
        if (onDragOverChange) onDragOverChange(null);

        // Hide Debug Line


        // Reset dragging status with a small delay
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);

        // Cleanup
        // Need to grab container BEFORE clearing ActiveRef
        const target = event.target as HTMLElement;
        const container = getScrollParent(target); // Optimistic best effort if ref is gone

        activeDragElementRef.current = null;

        const { y: pointerY } = getClientPoint(event);

        const currentCardCenterY_Viewport = pointerY + dragOffsetY.current;
        const containerRect = container.getBoundingClientRect();
        const scrollTop = container.scrollTop;
        const currentCardCenterY_Container = currentCardCenterY_Viewport - containerRect.top + scrollTop;

        const targetRow = findClosestDayRow(currentCardCenterY_Container, container);

        if (targetRow) {
            const targetDateStr = targetRow.getAttribute('data-date');

            // NOTE: We do NOT use elementFromPoint anymore.
            // We rely 100% on the calculated closest row.

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
                        Drop here
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
                                    layoutId={layoutId}
                                    onClick={() => handleDishClick(dish, layoutId)}
                                    drag
                                    onDragStart={(e) => handleItemDragStart(e, dish)}
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
                                    whileDrag={{ scale: 0.98 }}
                                    as="button"
                                    style={{
                                        pointerEvents: isInternalDragging ? 'none' : 'auto',
                                        opacity: draggingDishId === dish.id ? 0 : 1
                                    }}
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

            {
                dragOverlay && createPortal(
                    <div
                        className={styles.dragOverlayItem}
                        style={{
                            position: 'fixed',
                            left: dragOverlay.x,
                            top: dragOverlay.y,
                            width: dragOverlay.width,
                            height: dragOverlay.height,
                            zIndex: 9999,
                            pointerEvents: 'none'
                        }}
                    >
                        {dragOverlay.dish.image && (
                            <img
                                src={dragOverlay.dish.image}
                                alt={dragOverlay.dish.name}
                                className={styles.dishImage}
                            />
                        )}
                        <span>
                            {dragOverlay.dish.name}
                        </span>
                    </div>,
                    document.body
                )
            }
        </div >
    );
}
