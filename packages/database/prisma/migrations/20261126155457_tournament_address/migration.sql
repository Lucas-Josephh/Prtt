-- Adresse de la salle du tournoi, désormais obligatoire.
-- Les tournois déjà enregistrés reçoivent l'adresse utilisée jusqu'ici (écrite en dur dans le mail),
-- puis la valeur par défaut est retirée : chaque nouveau tournoi doit fournir la sienne.
ALTER TABLE "Tournament" ADD COLUMN "address" VARCHAR(255) NOT NULL DEFAULT 'Salle Henri Blanc, 66000 Perpignan';
ALTER TABLE "Tournament" ALTER COLUMN "address" DROP DEFAULT;
