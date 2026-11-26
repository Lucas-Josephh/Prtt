// Fonction Vercel : toutes les requêtes (/api/...) sont redirigées ici par vercel.json.
// Le code Nest est compilé dans dist/ par `nest build` (commande de build de vercel.json).
module.exports = require("../dist/serverless.js").default;
