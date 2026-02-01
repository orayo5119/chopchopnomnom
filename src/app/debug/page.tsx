import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function DebugPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return <div>Not signed in</div>;
    }

    const userId = (session.user as any).id;

    // Fetch user and linked accounts
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { accounts: true },
    });

    async function unlinkAccount(formData: FormData) {
        "use server";
        const accountId = formData.get("accountId") as string;
        if (!accountId) return;

        await prisma.account.delete({
            where: { id: accountId },
        });

        revalidatePath("/debug");
    }

    return (
        <div style={{ padding: "20px", fontFamily: "system-ui" }}>
            <h1>Debug Account Linking</h1>
            <div style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ccc", borderRadius: "8px" }}>
                <h2>Current User Profile</h2>
                <p><strong>ID:</strong> {user?.id}</p>
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <img src={user?.image || ""} alt="Avatar" style={{ width: "50px", borderRadius: "50%" }} />
            </div>

            <h2>Linked Login Accounts (The Keys to this User)</h2>
            <p>If you see multiple Google accounts listed here, it means they are both logging into the SAME user profile above.</p>
            <p><strong>Identify the one you want to separate (e.g. claudiarayline) and click "Unlink".</strong></p>

            <ul style={{ listStyle: "none", padding: 0 }}>
                {user?.accounts.map((acc) => (
                    <li key={acc.id} style={{ marginBottom: "10px", padding: "10px", background: "#f5f5f5", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <strong>Provider:</strong> {acc.provider} <br />
                            <small>ID: {acc.providerAccountId}</small>
                        </div>
                        <form action={unlinkAccount}>
                            <input type="hidden" name="accountId" value={acc.id} />
                            <button
                                type="submit"
                                style={{ background: "#ff4444", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}
                            >
                                Unlink / Remove Key
                            </button>
                        </form>
                    </li>
                ))}
            </ul>

            <div style={{ marginTop: "40px" }}>
                <a href="/" style={{ color: "blue", textDecoration: "underline" }}>&larr; Back to Planner</a>
            </div>
        </div>
    );
}
