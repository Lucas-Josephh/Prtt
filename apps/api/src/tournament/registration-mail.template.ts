/**
 * Email de confirmation d'inscription au tournoi.
 * HTML « à l'ancienne » (tableaux + styles en ligne) : c'est ce que Gmail, Outlook et les webmails affichent correctement.
 */

export interface RegistrationMailTable {
  letter: string;
  minimumCat: string;
  maximumCat: string;
  startAt: Date;
  price: number;
  extra: boolean;
}

export interface RegistrationMailData {
  tournament: {
    title: string;
    startDate: Date;
    endDate: Date;
    ja: string;
    email: string | null;
    phone: string | null;
    /** Adresse de la salle, saisie à la création du tournoi */
    address: string;
  };
  player: {
    name: string;
    surname: string;
    licence: string;
    ranking: number;
    numbered: number | null;
    club: string;
    email: string;
    phone: string | null;
  };
  tables: RegistrationMailTable[];
  /** Identifiant de l'image du logo jointe au mail (cid:…), ou null si le logo est absent. */
  logoCid: string | null;
}

const NAVY = "#1e3a5f";
const ORANGE = "#f97316";
const ORANGE_LIGHT = "#fff7ed";
const GREY = "#6b7280";
const BORDER = "#e5e7eb";
const FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Lien Google Maps vers l'adresse de la salle du tournoi. */
const mapUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
const CLUB = "Perpignan Roussillon Tennis de Table";

const TZ = "Europe/Paris";
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const dayKey = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: TZ });
const dayLong = (date: Date) => capitalize(date.toLocaleDateString("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }));
const time = (date: Date) => date.toLocaleTimeString("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).replace(":", "h");
const euros = (amount: number) => amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** « Samedi 23 mai » ou « Du samedi 23 au dimanche 24 mai 2027 ». */
function tournamentDates(start: Date, end: Date): string {
  const year = start.toLocaleDateString("fr-FR", { timeZone: TZ, year: "numeric" });
  if (dayKey(start) === dayKey(end)) return `${dayLong(start)} ${year}`;
  return `Du ${dayLong(start).toLowerCase()} au ${dayLong(end).toLowerCase()} ${year}`;
}

function categoryLabel(table: RegistrationMailTable): string {
  return `${table.minimumCat} – ${table.maximumCat}`;
}

/** Tableaux regroupés par jour, dans l'ordre chronologique. */
function groupByDay(tables: RegistrationMailTable[]): { label: string; tables: RegistrationMailTable[] }[] {
  const sorted = [...tables].sort((a, b) => a.startAt.getTime() - b.startAt.getTime() || a.letter.localeCompare(b.letter));
  const groups = new Map<string, { label: string; tables: RegistrationMailTable[] }>();
  for (const table of sorted) {
    const key = dayKey(table.startAt);
    const group = groups.get(key) ?? { label: dayLong(table.startAt), tables: [] };
    group.tables.push(table);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function registrationMailSubject(data: RegistrationMailData): string {
  return `${data.tournament.title} - Inscription confirmée`;
}

export function registrationMailHtml(data: RegistrationMailData): string {
  const { tournament, player, tables } = data;
  const total = tables.reduce((sum, t) => sum + t.price, 0);
  const first = [...tables].sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0];
  const count = tables.length;
  const e = escape;

  const infoRow = (label: string, value: string) => `
              <tr>
                <td style="padding:9px 0;border-bottom:1px solid ${BORDER};color:${GREY};font-size:13px;width:42%;">${label}</td>
                <td style="padding:9px 0;border-bottom:1px solid ${BORDER};color:${NAVY};font-size:14px;font-weight:700;text-align:right;">${value}</td>
              </tr>`;

  const tableRow = (table: RegistrationMailTable) => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid ${BORDER};width:56px;vertical-align:middle;">
                  <div style="width:44px;height:44px;line-height:44px;border-radius:10px;background:${ORANGE};color:#ffffff;font-size:20px;font-weight:900;text-align:center;">${e(table.letter)}</div>
                </td>
                <td style="padding:10px 0 10px 4px;border-bottom:1px solid ${BORDER};vertical-align:middle;">
                  <div style="color:${NAVY};font-size:15px;font-weight:800;">
                    Tableau ${e(table.letter)}${table.extra ? ` <span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:${ORANGE_LIGHT};color:${ORANGE};font-size:11px;font-weight:700;vertical-align:middle;">En plus</span>` : ""}
                  </div>
                  <div style="color:${GREY};font-size:13px;margin-top:2px;">Classement ${e(categoryLabel(table))} &nbsp;·&nbsp; début à <strong style="color:${NAVY};">${time(table.startAt)}</strong></div>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid ${BORDER};text-align:right;vertical-align:middle;white-space:nowrap;color:${NAVY};font-size:15px;font-weight:800;">
                  ${table.price > 0 ? euros(table.price) : "Gratuit"}
                </td>
              </tr>`;

  const daysHtml = groupByDay(tables)
    .map((group) => `
              <tr>
                <td colspan="3" style="padding:16px 0 4px;color:${ORANGE};font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">📅 ${e(group.label)}</td>
              </tr>${group.tables.map(tableRow).join("")}`)
    .join("");

  const card = (title: string, content: string) => `
        <tr>
          <td style="padding:0 24px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;">
              <tr>
                <td style="padding:18px 20px 6px;">
                  <div style="color:${NAVY};font-size:16px;font-weight:900;">${title}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 20px 14px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${content}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;

  const contactLines = [
    `<strong style="color:${NAVY};">${e(tournament.ja)}</strong>`,
    tournament.email ? `<a href="mailto:${e(tournament.email)}" style="color:${ORANGE};text-decoration:none;">${e(tournament.email)}</a>` : null,
    tournament.phone ? `<a href="tel:${e(tournament.phone.replace(/\s/g, ""))}" style="color:${ORANGE};text-decoration:none;">${e(tournament.phone)}</a>` : null,
  ].filter(Boolean).join("<br>");

  const tip = (icon: string, title: string, text: string) => `
              <tr>
                <td style="padding:8px 0;width:40px;vertical-align:top;font-size:20px;">${icon}</td>
                <td style="padding:8px 0;vertical-align:top;">
                  <div style="color:${NAVY};font-size:14px;font-weight:800;">${title}</div>
                  <div style="color:${GREY};font-size:13px;line-height:1.5;margin-top:2px;">${text}</div>
                </td>
              </tr>`;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${e(registrationMailSubject(data))}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:${FONT};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${e(player.name)}, vous êtes inscrit(e) à ${count} tableau${count > 1 ? "x" : ""} · ${total > 0 ? `${euros(total)} à régler sur place` : "inscription gratuite"}.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(15,23,42,.08);">

        <!-- En-tête -->
        <tr>
          <td style="background:${NAVY};border-bottom:4px solid ${ORANGE};padding:22px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                ${data.logoCid ? `<td style="padding-right:14px;vertical-align:middle;"><img src="cid:${data.logoCid}" width="52" height="52" alt="PRTT" style="display:block;border-radius:50%;border:2px solid #ffffff;"></td>` : ""}
                <td style="vertical-align:middle;">
                  <div style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:.5px;">PRTT</div>
                  <div style="color:rgba(255,255,255,.7);font-size:12px;">${CLUB}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Bandeau de confirmation -->
        <tr>
          <td align="center" style="padding:34px 24px 10px;">
            <div style="width:64px;height:64px;line-height:64px;border-radius:50%;background:#dcfce7;color:#16a34a;font-size:32px;font-weight:900;text-align:center;margin:0 auto;">✓</div>
            <h1 style="margin:18px 0 6px;color:${NAVY};font-size:26px;line-height:1.25;font-weight:900;">Votre inscription est confirmée&nbsp;!</h1>
            <div style="color:${ORANGE};font-size:16px;font-weight:800;">${e(tournament.title)}</div>
            <div style="color:${GREY};font-size:14px;margin-top:4px;">${e(tournamentDates(tournament.startDate, tournament.endDate))} · ${e(tournament.address)}</div>
          </td>
        </tr>

        <tr>
          <td style="padding:18px 28px 24px;color:#374151;font-size:15px;line-height:1.6;">
            Bonjour <strong style="color:${NAVY};">${e(player.name)}</strong>,<br>
            merci pour votre inscription&nbsp;! Toute l'équipe du PRTT a hâte de vous accueillir. 🏓<br>
            Retrouvez ci-dessous le récapitulatif de votre inscription&nbsp;:
          </td>
        </tr>

        <!-- Montant -->
        <tr>
          <td style="padding:0 24px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};border-radius:12px;">
              <tr>
                <td style="padding:22px 20px;">
                  <div style="color:rgba(255,255,255,.75);font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Montant à régler sur place</div>
                  <div style="color:${ORANGE};font-size:34px;font-weight:900;line-height:1.2;margin-top:4px;">${total > 0 ? euros(total) : "Gratuit"}</div>
                  <div style="color:#ffffff;font-size:13px;margin-top:4px;">${count} tableau${count > 1 ? "x" : ""} · paiement le jour du tournoi, à la table d'accueil</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
${card(`🏆 Vos tableaux (${count})`, `${daysHtml}
              <tr>
                <td colspan="2" style="padding:14px 0 4px;color:${NAVY};font-size:15px;font-weight:900;">Total</td>
                <td style="padding:14px 0 4px;text-align:right;color:${ORANGE};font-size:18px;font-weight:900;white-space:nowrap;">${total > 0 ? euros(total) : "Gratuit"}</td>
              </tr>`)}
${card("👤 Vos informations", [
    infoRow("Nom", e(player.surname.toUpperCase())),
    infoRow("Prénom", e(player.name)),
    infoRow("N° de licence", e(player.licence)),
    infoRow("Points", `${player.ranking} pts${player.numbered ? ` · N°${player.numbered}` : ""}`),
    infoRow("Club", e(player.club)),
    infoRow("Email", e(player.email)),
    ...(player.phone ? [infoRow("Téléphone", e(player.phone))] : []),
  ].join(""))}

        <!-- Le jour J -->
        <tr>
          <td style="padding:0 24px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ORANGE_LIGHT};border-radius:12px;">
              <tr>
                <td style="padding:18px 20px 10px;">
                  <div style="color:${NAVY};font-size:16px;font-weight:900;">📌 Le jour du tournoi</div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 20px 14px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${tip("📍", "Lieu", `${e(tournament.address)} · <a href="${e(mapUrl(tournament.address))}" style="color:${ORANGE};font-weight:700;text-decoration:none;">Voir l'itinéraire →</a>`)}${first ? tip("⏰", "Votre premier tableau", `${e(dayLong(first.startAt))} à <strong>${time(first.startAt)}</strong> (tableau ${e(first.letter)}). Présentez-vous à la table d'arbitrage 30min avant le début du tableau.`) : ""}${tip("💶", "Règlement", `${total > 0 ? `<strong>${euros(total)}</strong> à régler sur place` : "Aucun montant à régler"}, le jour du tournoi.`)}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Contact -->
        <tr>
          <td style="padding:0 28px 26px;color:${GREY};font-size:13px;line-height:1.6;">
            <div style="color:${NAVY};font-size:14px;font-weight:900;margin-bottom:4px;">Une question, une erreur dans votre inscription&nbsp;?</div>
            Répondez simplement à ce mail ou contactez le juge-arbitre&nbsp;:<br>
            ${contactLines}
          </td>
        </tr>

        <!-- Pied de page -->
        <tr>
          <td align="center" style="background:#f9fafb;border-top:1px solid ${BORDER};padding:18px 24px;color:#9ca3af;font-size:12px;line-height:1.6;">
            🏓 <strong style="color:${NAVY};">PRTT</strong> – ${CLUB}<br>
            ${e(tournament.address)}<br>
            Vous recevez ce mail car vous vous êtes inscrit(e) au tournoi sur le site du club.
          </td>
        </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Version texte (clients mail sans HTML, et meilleure délivrabilité). */
export function registrationMailText(data: RegistrationMailData): string {
  const { tournament, player, tables } = data;
  const total = tables.reduce((sum, t) => sum + t.price, 0);
  const lines: string[] = [
    `Bonjour ${player.name},`,
    "",
    `Votre inscription au tournoi « ${tournament.title} » est confirmée !`,
    `${tournamentDates(tournament.startDate, tournament.endDate)} · ${tournament.address}`,
    "",
    `MONTANT À RÉGLER SUR PLACE : ${total > 0 ? euros(total) : "gratuit"} (le jour du tournoi, à la table d'accueil)`,
    "",
    `VOS TABLEAUX (${tables.length})`,
  ];
  for (const group of groupByDay(tables)) {
    lines.push(`  ${group.label}`);
    for (const t of group.tables) {
      lines.push(`  - Tableau ${t.letter}${t.extra ? " (en plus)" : ""} : classement ${categoryLabel(t)}, début à ${time(t.startAt)} — ${t.price > 0 ? euros(t.price) : "gratuit"}`);
    }
  }
  lines.push(
    `  Total : ${total > 0 ? euros(total) : "gratuit"}`,
    "",
    "VOS INFORMATIONS",
    `  Nom : ${player.surname.toUpperCase()}`,
    `  Prénom : ${player.name}`,
    `  N° de licence : ${player.licence}`,
    `  Points : ${player.ranking}${player.numbered ? ` (N°${player.numbered})` : ""}`,
    `  Club : ${player.club}`,
    `  Email : ${player.email}`,
    ...(player.phone ? [`  Téléphone : ${player.phone}`] : []),
    "",
    "LE JOUR DU TOURNOI",
    `  Lieu : ${tournament.address} (${mapUrl(tournament.address)})`,
    "",
    "Une question ou une erreur ? Répondez à ce mail ou contactez le juge-arbitre :",
    `  ${[tournament.ja, tournament.email, tournament.phone].filter(Boolean).join(" · ")}`,
    "",
    `À très vite à la salle !`,
    `PRTT – ${CLUB}`,
  );
  return lines.join("\n");
}
