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
                style={{ cursor: "pointer" }}
                title="Sign Out"
            >
                {user?.image ? (
                    <img src={user.image} alt={user.name || "User"} className={styles.avatar} />
                ) : (
                    <div className={styles.avatarPlaceholder}>
                        {user?.name?.[0] || "U"}
                    </div>
                )}
            </div>
        </header>
    );
}
