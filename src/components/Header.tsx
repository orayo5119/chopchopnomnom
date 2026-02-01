"use client";

import { DefaultSession } from "next-auth";
import { signOut } from "next-auth/react";
import styles from "./Header.module.css";

interface HeaderProps {
    user?: DefaultSession["user"];
}

export default function Header({ user }: HeaderProps) {
    return (
        <header className={styles.header}>
            <h1 className={styles.title}>ChopChopNomNom</h1>
            <div
                className={styles.profile}
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}
                title="Sign Out"
            >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                        {user?.name || "User"}
                    </span>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>
                        {user?.email || ""}
                    </span>
                </div>
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
