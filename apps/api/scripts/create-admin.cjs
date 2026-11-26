#!/usr/bin/env node
/**
 * Crée un compte administrateur, ou change son mot de passe s'il existe déjà.
 *
 *   pnpm --filter @prtt/api admin:create <identifiant>
 *
 * Le mot de passe est demandé au clavier (12 caractères minimum, non affiché).
 * Base visée : DATABASE_URL de l'environnement, sinon celle de packages/database/.env.
 * Pour la production : définir DATABASE_URL dans le terminal avant de lancer la commande.
 */
const { randomBytes } = require("node:crypto");
const readline = require("node:readline");
const { hash } = require("bcryptjs");
const { PrismaClient } = require("@prtt/database");

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Masque la saisie : rien n'est affiché après la question
    rl._writeToOutput = (text) => { if (text.startsWith(question)) rl.output.write(text); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write("\n"); resolve(answer); });
  });
}

async function main() {
  const identifier = (process.argv[2] ?? "").trim();
  if (!identifier || identifier.length > 191) {
    console.error("Usage : pnpm --filter @prtt/api admin:create <identifiant>");
    process.exit(1);
  }

  const password = await askHidden("Mot de passe : ");
  if (password.length < 12) {
    console.error("Le mot de passe doit faire au moins 12 caractères.");
    process.exit(1);
  }
  if ((await askHidden("Confirmez le mot de passe : ")) !== password) {
    console.error("Les deux mots de passe sont différents.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await hash(password, 12);
    const existing = await prisma.adminUser.findUnique({ where: { identifier } });
    if (existing) {
      await prisma.adminUser.update({ where: { identifier }, data: { password: passwordHash } });
      console.log(`Mot de passe de « ${identifier} » mis à jour.`);
    } else {
      await prisma.adminUser.create({ data: { id: randomBytes(16).toString("hex"), identifier, password: passwordHash } });
      console.log(`Compte administrateur « ${identifier} » créé.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Erreur :", error.message);
  process.exit(1);
});
