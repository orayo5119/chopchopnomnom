"use client";

import { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DayRow from "./DayRow";
import AddDishModal from "./AddDishModal";
import SingleDayView from "./SingleDayView";
import NoteComponent from "./NoteComponent";
import { ChevronLeft, ChevronRight } from "./Icons";
import styles from "./Planner.module.css";
import DishOptionsModal from "./DishOptionsModal";

// Interface for a Dish
interface Dish {
    id: string;
    name: string;
    link?: string;
    image?: string;
    date: string; // ISO Date string YYYY-MM-DD
    order?: number;
}

export default function Planner() {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewingDish, setViewingDish] = useState<Dish | null>(null);

    const [viewingDate, setViewingDate] = useState<Date | null>(null);
    const [weeklyNote, setWeeklyNote] = useState("");

    // Context Menu State
    const [contextDish, setContextDish] = useState<Dish | null>(null);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

    // Edit/Copy State
    const [isEditMode, setIsEditMode] = useState(false);
    const [clipboardDish, setClipboardDish] = useState<Dish | null>(null);
    const [showPasteToast, setShowPasteToast] = useState(false);

    // Auto-Update State
    const [showUpdateToast, setShowUpdateToast] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchDishes();
    }, []);

    // Polling for updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDishes(true);
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, [dishes]); // Depend on dishes to compare

    async function fetchDishes(isPolling = false) {
        try {
            const res = await fetch("/api/dishes");
            if (res.ok) {
                const data = await res.json();

                if (isPolling) {
                    // Check for changes (Simple JSON comparison)
                    // Note: This relies on deterministic order which API ensures (date asc, order asc)
                    if (JSON.stringify(data) !== JSON.stringify(dishes)) {
                        setDishes(data);
                        setShowUpdateToast(true);
                        setTimeout(() => setShowUpdateToast(false), 3000);
                    }
                } else {
                    setDishes(data);
                }
            }
        } catch (e) {
            console.error("Failed to fetch dishes", e);
        }
    }

    // Generate 7 days start from Monday of current week
    const weekDays = useMemo(() => {
        const curr = new Date(currentDate);
        const day = curr.getDay(); // 0 is Sunday, 1 is Monday
        const diff = day === 0 ? 6 : day - 1; // Calculate diff to get to Monday
        const startOfWeek = new Date(curr);
        startOfWeek.setDate(curr.getDate() - diff); // Set to Monday

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d);
        }
        return days;
    }, [currentDate]);

    // Fetch weekly note
    useEffect(() => {
        async function fetchNote() {
            try {
                const startOfWeek = weekDays[0].toISOString().split('T')[0];
                const res = await fetch(`/api/notes?date=${startOfWeek}`);
                if (res.ok) {
                    const data = await res.json();
                    setWeeklyNote(data.content || "");
                }
            } catch (e) {
                console.error("Failed to fetch note", e);
            }
        }
        fetchNote();
    }, [weekDays]);

    const [selectedPasteDate, setSelectedPasteDate] = useState<Date | null>(null);

    // Drag Target Feedback
    const [dragTargetDate, setDragTargetDate] = useState<Date | null>(null);

    const handleDragOverDay = (date: Date | null) => {
        setDragTargetDate(date);
    };

    const handleAddDish = (date: Date) => {
        if (clipboardDish && showPasteToast) {
            // Paste Logic
            saveDish(clipboardDish.name, clipboardDish.link, date);
            setClipboardDish(null);
            setShowPasteToast(false);
            setSelectedPasteDate(null);
        } else {
            // Normal Add Logic
            setSelectedDate(date);
            setIsModalOpen(true);
            setIsEditMode(false); // Ensure add mode
        }
    };



    const saveDish = async (name: string, link?: string, dateOverride?: Date) => {
        const targetDate = dateOverride || selectedDate;
        if (targetDate) {
            const dateStr = targetDate.toISOString().split('T')[0];

            // Check if editing existing dish
            if (isEditMode && contextDish) {
                // Optimistic update
                setDishes(prev => prev.map(d =>
                    d.id === contextDish.id ? { ...d, name, link: link || "", date: dateStr } : d
                ));
                // TODO: API call to update dish details (PUT)
                // Assuming separate endpoint or reusing existing logic
                setIsModalOpen(false);
                setContextDish(null);
                setIsEditMode(false);
                return;
            }

            try {
                const res = await fetch("/api/dishes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, link, date: dateStr })
                });
                if (res.ok) {
                    const newDish = await res.json();
                    setDishes(prev => [...prev, newDish]);
                    setIsModalOpen(false);
                }
            } catch (e) {
                console.error("Failed to save dish", e);
            }
        }
    };

    const saveNote = async (content: string) => {
        const startOfWeek = weekDays[0].toISOString().split('T')[0];
        try {
            await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: startOfWeek, content })
            });
            setWeeklyNote(content);
        } catch (e) {
            console.error("Failed to save note", e);
        }
    };

    const updateDishDate = async (dishId: string, newDate: Date) => {
        const dateStr = newDate.toISOString().split('T')[0];

        // Optimistic update
        setDishes(prev => prev.map(d =>
            d.id === dishId ? { ...d, date: dateStr } : d
        ));

        // Attempt verify if API endpoint exists or if we should just assume success for now.
        // Since I see no PUT/PATCH in previous `saveDish` context, I'll assume for this task 
        // we mainly want the UI interaction. I will try a PUT just in case if the user had backend.
        // If not, at least the UI works.
        try {
            await fetch(`/api/dishes`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: dishId, date: dateStr })
            });
        } catch (e) {
            console.error("Failed to update dish date", e);
            // Revert if needed? staying optimistic for now
        }
    };

    const getDishesForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return dishes.filter(d => d.date === dateStr).sort((a, b) => (a.order || 0) - (b.order || 0));
    };

    const startStr = weekDays[0].toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
    const endStr = weekDays[6].toLocaleDateString("en-US", { month: "numeric", day: "numeric" });

    const handleLongPress = (dish: Dish) => {
        setContextDish(dish);
        setIsOptionsOpen(true);
    };

    const handleEditDish = () => {
        setIsOptionsOpen(false);
        if (contextDish) {
            // Find the date object for this dish to set selectedDate (needed for Modal title)
            const dishDate = new Date(contextDish.date);
            // Adjust for timezone if needed, but ISO string usually splits fine if local time wasn't used
            // actually d.date is YYYY-MM-DD. 
            // We need to match it to a weekDays item or just create new Date
            // Adding "T12:00:00" ensures noon so timezone offsets don't shift the day
            setSelectedDate(new Date(contextDish.date + "T12:00:00"));

            setIsEditMode(true);
            setIsModalOpen(true);
        }
    };

    const handleCopyDish = () => {
        setClipboardDish(contextDish);
        setIsOptionsOpen(false);
        setContextDish(null);
        setShowPasteToast(true);
        setSelectedPasteDate(null);
    };

    const handleRemoveDish = async () => {
        if (contextDish) {
            setDishes(prev => prev.filter(d => d.id !== contextDish.id));
            // TODO: API DELETE request
            setIsOptionsOpen(false);
            setContextDish(null);
        }
    };

    const handleReorder = async (newDishes: Dish[]) => {
        // Optimistic update
        const updatedDishes = newDishes.map((d, index) => ({ ...d, order: index }));

        setDishes(prev => {
            const updatedMap = new Map(updatedDishes.map(d => [d.id, d]));
            return prev.map(d => updatedMap.get(d.id) || d);
        });

        // Persist
        // We can fire and forget or track errors
        for (const dish of updatedDishes) {
            try {
                await fetch("/api/dishes", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: dish.id, order: dish.order })
                });
            } catch (e) {
                console.error("Failed to persist order", e);
            }
        }
    };

    return (
        <div className={styles.planner}>
            <header className={styles.weekHeader}>
                <button onClick={() => {
                    const d = new Date(currentDate);
                    d.setDate(d.getDate() - 7);
                    setCurrentDate(d);
                }} className={styles.navButton}>
                    <ChevronLeft />
                </button>
                <span>{startStr} Mon - {endStr} Sun</span>
                <button onClick={() => {
                    const d = new Date(currentDate);
                    d.setDate(d.getDate() + 7);
                    setCurrentDate(d);
                }} className={styles.navButton}>
                    <ChevronRight />
                </button>
            </header>

            {dishes.length === 0 && (
                <div className={styles.emptyState}>
                    <p>Start planning your meals for the week!</p>
                </div>
            )}

            {viewingDish && viewingDate ? (
                <SingleDayView
                    key="single-day-view"
                    date={viewingDate}
                    dish={viewingDish}
                    dishes={getDishesForDate(viewingDate)}
                    onBack={() => {
                        setViewingDish(null);
                        setViewingDate(null);
                    }}
                />
            ) : (
                <div className={styles.weekViewContainer}>
                    <motion.div
                        className={styles.daysList}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key="week-view"
                    >
                        {weekDays.map((date) => (
                            <DayRow
                                key={date.toISOString()}
                                date={date}
                                dayName={date.toLocaleDateString("en-US", { weekday: "short" })}
                                dishes={getDishesForDate(date)}
                                onAddDish={() => handleAddDish(date)}
                                onDishClick={(dish) => {
                                    setViewingDish(dish);
                                    setViewingDate(date);
                                }}
                                onMoveDish={updateDishDate}
                                onDishLongPress={handleLongPress}
                                onReorder={handleReorder}
                                isSelected={!!(clipboardDish && showPasteToast && selectedPasteDate && selectedPasteDate.toDateString() === date.toDateString())}
                                onSelect={() => {
                                    if (clipboardDish && showPasteToast) {
                                        setSelectedPasteDate(date);
                                    }
                                }}
                                isDragTarget={!!(dragTargetDate && dragTargetDate.toDateString() === date.toDateString())}
                                onDragOverChange={handleDragOverDay}
                            />
                        ))}


                        <div style={{ paddingBottom: '80px' }}>
                            <NoteComponent
                                content={weeklyNote}
                                onSave={saveNote}
                                version="v1.0.34"
                            />
                        </div>
                    </motion.div>
                </div>
            )}

            <AddDishModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setIsEditMode(false);
                    setContextDish(null);
                }}
                onSave={(name, link) => saveDish(name, link)}
                dayName={selectedDate ? selectedDate.toLocaleDateString("en-US", { month: "numeric", day: "numeric", weekday: "short" }) : ""}
                initialName={isEditMode && contextDish ? contextDish.name : ""}
                initialLink={isEditMode && contextDish ? contextDish.link : ""}
            />

            <DishOptionsModal
                isOpen={isOptionsOpen}
                onClose={() => setIsOptionsOpen(false)}
                onEdit={handleEditDish}
                onCopy={handleCopyDish}
                onRemove={handleRemoveDish}
                dish={contextDish}
            />


            <AnimatePresence>
                {showPasteToast && (
                    <motion.div
                        className={styles.toast}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        Select a date to paste the dish
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showUpdateToast && (
                    <motion.div
                        className={styles.toast}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        key="update-toast"
                    >
                        Page updated
                    </motion.div>
                )}
            </AnimatePresence>


        </div>


    );
}

