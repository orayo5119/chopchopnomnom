"use client";

import { DefaultSession } from "next-auth";
import { signOut } from "next-auth/react";
import { useState } from "react";
import styles from "./Header.module.css";

interface HeaderProps {
    user?: DefaultSession["user"];
}

export default function Header({ user }: HeaderProps) {
    const [imgError, setImgError] = useState(false);
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
                {/* Debug: check URL source and email */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '8px' }}>
                    <span style={{ fontSize: '9px', color: '#fff' }}>
                        {user?.email || "No Email"}
                    </span>
                    <span style={{ fontSize: '9px', color: '#fff', maxWidth: '100px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {user?.image ? "Img: " + user.image.substring(0, 15) + "..." : "No Img"}
                        {imgError && " (ERR)"}
                    </span>
                </div>

                {user?.image && !imgError ? (
                    <img
                        src={user.image}
                        alt={user.name || "User"}
                        className={styles.avatar}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            console.error("Image load error", e);
                            setImgError(true);
                        }}
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
