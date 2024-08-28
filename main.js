const fs = require('fs');
const data = fs.readFileSync('groups.json', 'utf8');
const groups = JSON.parse(data);

const [a, b, c] = [groups['A'], groups['B'], groups['C']];

const initializeValues = (grp) => {
  for (let i of grp) {
    i.wins = 0;
    i.losses = 0;
    i.points = 0;
    i.goalsWon = 0;
    i.goalsLost = 0;
    i.matches = [];
  }
};

const simulateGame = (team1, team2) => {
  const score = [];
  const rankDiff = team2['FIBARanking'] - team1['FIBARanking'];
  const probability = 1 / (1 + Math.exp(rankDiff / 10)); // logisitc function for win probability
  const random = Math.random();
  const winner = random < probability ? team1 : team2;

  if (winner['ISOCode'] === team1['ISOCode']) {
    let [val1, val2] = [0, 0];

    do {
      val1 = Math.round(Math.random() * 200);
    } while (val1 === 0);

    do {
      val2 = Math.round(Math.random() * 200);
    } while (val2 > val1);

    score.push(val1, val2);
  } else if (winner['ISOCode'] === team2['ISOCode']) {
    let [val1, val2] = [0, 0];

    do {
      val2 = Math.round(Math.random() * 200);
    } while (val2 === 0);

    do {
      val1 = Math.round(Math.random() * 200);
    } while (val1 > val2);

    score.push(val1, val2);
  }

  console.log(`\t\t${team1['Team']} - ${team2['Team']} [${score[0]} : ${score[1]}]`);
};

const firstPhase = (grp) => {
  for (let i = 0; i < 3; i++) {
    initializeValues([a, b, c][i]);
  }

  simulateGame(grp[0], grp[2]);
  simulateGame(grp[1], grp[3]);
};

console.log("Grupna faza - I kolo:");
for (let i = 0; i < 3; i++) {
  console.log(`\tGrupa ${['A', 'B', 'C'][i]}:`);
  firstPhase([a, b, c][i]);
}


