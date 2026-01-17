"use client";

import { useState } from "react";
import styles from "./AddDishModal.module.css";

interface AddDishModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dishName: string, link?: string) => void;
    dayName: string;
    initialName?: string;
    initialLink?: string;
}

export default function AddDishModal({ isOpen, onClose, onSave, dayName, initialName = "", initialLink = "" }: AddDishModalProps) {
    const [name, setName] = useState(initialName);
    const [link, setLink] = useState(initialLink);

    // Sync state when props change (re-opening with new data)
    useState(() => {
        if (isOpen) {
            setName(initialName);
            setLink(initialLink);
        }
    });

    // Better pattern: useEffect
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setName(initialName);
            setLink(initialLink);
        }
    }

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name, link);
            setName("");
            setLink("");
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>{initialName ? "Edit Dish" : `Add a dish to (${dayName})`}</h3>
                    <button onClick={onClose} className={styles.closeButton}>×</button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="dishName" className={styles.hiddenLabel}>Dish Name</label>
                        <input
                            id="dishName"
                            type="text"
                            placeholder="Dish"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={styles.input}
                            required
                            autoFocus
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="dishLink" className={styles.hiddenLabel}>Link</label>
                        <input
                            id="dishLink"
                            type="url"
                            placeholder="Link (optional)"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    <button type="submit" className={styles.saveButton}>
                        {initialName ? "Save Changes" : "Save"}
                    </button>
                </form>
            </div>
        </div>
    );
}
