export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
/** Site du club, sur lequel l'administrateur est renvoyé après la connexion. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export class ApiError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
    }
}

/** Appel à l'API NestJS, avec envoi du cookie de session. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        ...init,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...init.headers },
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null) as { message?: string | string[] } | null;
        const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
        throw new ApiError(res.status, message ?? res.statusText);
    }

    return (res.status === 204 ? undefined : await res.json()) as T;
}
