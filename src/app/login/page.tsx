"use client";

import { signIn } from "next-auth/react";
import styles from "./login.module.css";
import { useEffect, useState } from "react";

export default function LoginPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>ChopChopNomNom</h1>
                <div className={styles.circle}></div>
                <button
                    className={styles.googleButton}
                    onClick={() => signIn("google", { callbackUrl: "/", prompt: "select_account" })}
                >
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google Logo"
                        className={styles.googleIcon}
                    />
                    Sign In with Google
                </button>
            </div>
        </div>
    );
}
