"use client";

import { motion, AnimatePresence } from "framer-motion";
import styles from "./DishOptionsModal.module.css";

interface DishOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onCopy: () => void;
    onRemove: () => void;
    dish: { name: string; image?: string; link?: string } | null;
}

export default function DishOptionsModal({ isOpen, onClose, onEdit, onCopy, onRemove, dish }: DishOptionsModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className={styles.modal}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <div className={styles.handle} />
                        <button className={styles.closeButton} onClick={onClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        {dish && (
                            <div className={styles.dishPreview}>
                                {dish.image && (
                                    <img src={dish.image} alt={dish.name} className={styles.dishImage} />
                                )}
                                <span className={styles.dishName}>{dish.name}</span>
                            </div>
                        )}

                        <div className={styles.actions}>
                            <div className={styles.primaryActions}>
                                <button onClick={onEdit} className={styles.actionButton}>
                                    Edit
                                </button>
                                <button onClick={onCopy} className={styles.actionButton}>
                                    Copy
                                </button>
                            </div>
                            <button onClick={onRemove} className={`${styles.actionButton} ${styles.removeButton}`}>
                                Remove
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
