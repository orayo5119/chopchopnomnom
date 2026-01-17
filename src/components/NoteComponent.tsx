
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import styles from "./NoteComponent.module.css";
import { ChevronUp, ChevronDown } from "./Icons";

interface NoteComponentProps {
    content: string;
    onSave: (content: string) => void;
}

export default function NoteComponent({ content: initialContent, onSave }: NoteComponentProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [noteContent, setNoteContent] = useState(initialContent);
    const [showSavedToast, setShowSavedToast] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-save logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (noteContent !== initialContent) {
                onSave(noteContent);
                setShowSavedToast(true);
                setTimeout(() => setShowSavedToast(false), 2000);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [noteContent, initialContent, onSave]);

    // Sync state if prop changes (e.g. switching weeks)
    useEffect(() => {
        setNoteContent(initialContent);
    }, [initialContent]);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(false);
        onSave(noteContent);
    };

    return (
        <>
            {/* Collapsed View (Always visible at bottom) */}
            <motion.div
                className={styles.noteCollapsed}
                onClick={handleToggle}
                layoutId="note-container"
            >
                <div className={styles.collapsedHeader}>
                    <div className={styles.noteLabel}>Note:</div>
                    <ChevronUp className={styles.chevron} />
                </div>
                <div className={styles.notePreview}>
                    {noteContent || "Tap to add notes..."}
                </div>
            </motion.div>

            {/* Expanded View (Overlay) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className={styles.noteExpandedOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setIsExpanded(false);
                            onSave(noteContent);
                        }}
                    >
                        <motion.div
                            className={styles.noteExpandedContainer}
                            layoutId="note-container"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                        >
                            <div className={styles.expandedHeader}>
                                <span className={styles.noteLabel}>Note:</span>
                                <button className={styles.closeButton} onClick={handleClose}>
                                    <ChevronDown />
                                </button>
                            </div>

                            <textarea
                                ref={textareaRef}
                                className={styles.noteTextarea}
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Type your notes here..."
                                autoFocus
                            />
                            <AnimatePresence>
                                {showSavedToast && (
                                    <motion.div
                                        className={styles.savedToast}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                    >
                                        Saved
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
