"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { apiFetch } from "@web/lib/api";

export interface SessionUser {
    id: string;
    identifier: string;
}

interface SessionResponse {
    user: SessionUser;
    expiresAt: number;
}

type SessionState =
    | { status: "loading" }
    | { status: "anonymous" }
    | { status: "authenticated"; user: SessionUser; expiresAt: number };

interface SessionContextValue {
    session: SessionState;
    /** À appeler après un login réussi. */
    setAuthenticated: (data: SessionResponse) => void;
    logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Événements considérés comme une activité de l'utilisateur. */
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "input", "change", "wheel", "touchstart", "scroll"] as const;

/**
 * Délai minimal entre deux prolongations envoyées à l'API : toute activité
 * est prise en compte, mais au plus un appel toutes les 30 s.
 */
const REFRESH_THROTTLE_MS = 30_000;

export default function SessionProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<SessionState>({ status: "loading" });
    const lastRefresh = useRef(0);
    const pendingRefresh = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setAuthenticated = useCallback((data: SessionResponse) => {
        lastRefresh.current = Date.now();
        setSession({ status: "authenticated", user: data.user, expiresAt: data.expiresAt });
    }, []);

    const logout = useCallback(async () => {
        await apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
        setSession({ status: "anonymous" });
    }, []);

    // Récupère la session existante au chargement
    useEffect(() => {
        apiFetch<SessionResponse>("/auth/me")
            .then(setAuthenticated)
            .catch(() => setSession({ status: "anonymous" }));
    }, [setAuthenticated]);

    const authenticated = session.status === "authenticated";
    const expiresAt = authenticated ? session.expiresAt : 0;

    // Réinitialise la session à chaque action de l'utilisateur
    useEffect(() => {
        if (!authenticated) return;

        const refresh = () => {
            pendingRefresh.current = null;
            lastRefresh.current = Date.now();
            apiFetch<SessionResponse>("/auth/refresh", { method: "POST" })
                .then(setAuthenticated)
                .catch(() => setSession({ status: "anonymous" }));
        };

        const onActivity = () => {
            if (pendingRefresh.current) return;
            const wait = lastRefresh.current + REFRESH_THROTTLE_MS - Date.now();
            if (wait <= 0) refresh();
            else pendingRefresh.current = setTimeout(refresh, wait);
        };

        ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true, capture: true }));
        return () => {
            ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity, { capture: true }));
            if (pendingRefresh.current) clearTimeout(pendingRefresh.current);
            pendingRefresh.current = null;
        };
    }, [authenticated, setAuthenticated]);

    // Sans activité pendant 15 min, la session expire aussi côté front
    useEffect(() => {
        if (!expiresAt) return;
        const timer = setTimeout(() => setSession({ status: "anonymous" }), Math.max(0, expiresAt - Date.now()));
        return () => clearTimeout(timer);
    }, [expiresAt]);

    return (
        <SessionContext.Provider value={{ session, setAuthenticated, logout }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) throw new Error("useSession doit être utilisé dans <SessionProvider>");
    return context;
}
