// Difficulte progressive du Grand Marathon Medix : 5 tranches de 20
// questions, du plus facile au plus difficile. Reprend la logique du
// prototype ; la source de verite pour le score/XP reste le serveur.
export const MARATHON_BANDS = [
  { from: 0, to: 20, minLevel: 1, maxLevel: 4 },
  { from: 20, to: 40, minLevel: 3, maxLevel: 7 },
  { from: 40, to: 60, minLevel: 6, maxLevel: 10 },
  { from: 60, to: 80, minLevel: 9, maxLevel: 13 },
  { from: 80, to: 100, minLevel: 12, maxLevel: 15 },
];
export const MARATHON_QUESTION_COUNT = 100;
export const MARATHON_UNLOCK_GRADE_INDEX = 3; // Interne I
export const MARATHON_MILESTONES = {
  25: "Un quart du chemin parcouru — votre concentration est excellente, continuez ainsi.",
  50: "La moitie du Marathon est derriere vous ! C'est le moment de tenir le rythme.",
  75: "Trois quarts termines — la derniere ligne droite commence, restez rigoureux jusqu'au bout.",
  100: "Derniere question ! Donnez le meilleur de vous-meme.",
};
