export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

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

/** Taille maximale d'une photo choisie par l'admin : elle est compressée dans le navigateur avant l'envoi. */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
/** Plus grand côté de l'image envoyée (l'API recompresse ensuite en WebP 1600 px). */
const UPLOAD_MAX_DIMENSION = 2000;

/**
 * Réduit l'image dans le navigateur (2000 px, JPEG 85 %) : une photo de téléphone de 5 à 15 Mo passe
 * sous 1 Mo, bien en dessous de la limite de 4,5 Mo par requête de Vercel. En cas d'échec, envoie l'original.
 */
async function shrinkImage(file: File): Promise<Blob> {
    try {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        const scale = Math.min(1, UPLOAD_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
        if (scale === 1 && file.size < 1024 * 1024) { bitmap.close(); return file; }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const context = canvas.getContext("2d");
        if (!context) { bitmap.close(); return file; }
        // Fond blanc : les zones transparentes d'un PNG ne deviennent pas noires en JPEG
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
        return blob && blob.size < file.size ? blob : file;
    } catch {
        return file;
    }
}

/** Envoie une image à l'API (admin) ; renvoie son chemin, à enregistrer dans `imageUrl`. */
export async function apiUpload(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", await shrinkImage(file), "image.jpg");
    // Pas de Content-Type : le navigateur ajoute lui-même le « boundary » du multipart
    const res = await fetch(`${API_URL}/uploads`, { method: "POST", body: form, credentials: "include" });
    if (!res.ok) {
        const body = await res.json().catch(() => null) as { message?: string | string[] } | null;
        const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
        throw new ApiError(res.status, message ?? res.statusText);
    }
    return ((await res.json()) as { url: string }).url;
}

/**
 * URL affichable d'une image enregistrée, ou null s'il n'y en a pas :
 * - Vercel Blob (production) : l'URL complète est déjà en base ;
 * - disque (développement) : « /uploads/<id>.webp », servi par l'API.
 */
export function imageSrc(path: string | null | undefined): string | null {
    if (!path) return null;
    return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`;
}

/** Télécharge un fichier renvoyé par l'API (ex. export Excel), avec le cookie de session. */
export async function apiDownload(path: string, fallbackName: string): Promise<void> {
    const res = await fetch(`${API_URL}${path}`, { credentials: "include" });
    if (!res.ok) {
        const body = await res.json().catch(() => null) as { message?: string | string[] } | null;
        const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
        throw new ApiError(res.status, message ?? res.statusText);
    }

    const disposition = res.headers.get("Content-Disposition") ?? "";
    const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName;

    const url = URL.createObjectURL(await res.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
