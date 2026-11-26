import { waitUntil } from "@vercel/functions";

/**
 * Lance une tâche sans faire attendre la réponse HTTP (email de confirmation, fichier Excel…).
 * Sur Vercel, une fonction est gelée dès que la réponse est envoyée : `waitUntil` la garde active
 * jusqu'à la fin de la tâche. En local (serveur Node classique), la tâche continue d'elle-même.
 * La tâche doit gérer ses propres erreurs ; une erreur restante est ignorée ici.
 */
export function runInBackground(task: Promise<unknown>): void {
  const safe = task.catch(() => undefined);
  if (process.env.VERCEL) waitUntil(safe);
}
