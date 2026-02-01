"use client";

import { DefaultSession } from "next-auth";
import { signOut } from "next-auth/react";
import styles from "./Header.module.css";

interface HeaderProps {
    user?: DefaultSession["user"];
}

export default function Header({ user }: HeaderProps) {
    console.log("Header user prop:", user);
    return (
        <header className={styles.header}>
            <h1 className={styles.title}>ChopChopNomNom</h1>
            <div
                className={styles.profile}
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                title="Sign Out"
            >
                {/* Temp Debug: Show if image URL exists */}
                <span style={{ fontSize: '10px', color: '#333' }}>
                    {user?.image ? "Has Img" : "No Img"}
                </span>

                {user?.image ? (
                    <img
                        src={user.image}
                        alt={user.name || "User"}
                        className={styles.avatar}
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className={styles.avatarPlaceholder}>
                        {user?.name?.[0] || "U"}
                    </div>
                )}
            </div>
        </header>
    );
}
