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

for (let i = 0; i < 3; i++) {
  initializeValues([a, b, c][i]);
}

const updateStats = (team1, team2, val1, val2) => {
  team1.wins++;
  team1.points += 2;
  team1.goalsWon += val1;
  team1.goalsLost += val2;
  team2.losses++;
  team2.points++;
  team2.goalsWon += val2;
  team2.goalsLost += val1;
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

    updateStats(team1, team2, val1, val2);
    score.push(val1, val2);
  } else if (winner['ISOCode'] === team2['ISOCode']) {
    let [val1, val2] = [0, 0];

    do {
      val2 = Math.round(Math.random() * 200);
    } while (val2 === 0);

    do {
      val1 = Math.round(Math.random() * 200);
    } while (val1 > val2);

    updateStats(team2, team1, val2, val1);
    score.push(val1, val2);
  }

  console.log(`\t\t${team1['Team']} - ${team2['Team']} [${score[0]} : ${score[1]}]`);
};

const firstPhase = (grp) => {

  simulateGame(grp[0], grp[2]);
  simulateGame(grp[1], grp[3]);
};

const secondPhase = (grp) => {
  simulateGame(grp[1], grp[0]);
  simulateGame(grp[2], grp[3]);
};

const thirdPhase = (grp) => {
  simulateGame(grp[3], grp[0]);
  simulateGame(grp[1], grp[2]);

  grp.sort((a, b) => {
    return b.points - a.points;
  })
}

console.log("Grupna faza - I kolo:");
for (let i = 0; i < 3; i++) {
  console.log(`\tGrupa ${['A', 'B', 'C'][i]}:`);
  firstPhase([a, b, c][i]);
}

console.log();
console.log("Grupna faza - II kolo:");
for (let i = 0; i < 3; i++) {
  console.log(`\tGrupa ${['A', 'B', 'C'][i]}:`);
  secondPhase([a, b, c][i]);
}

console.log();
console.log('Grupna faza - III kolo:');
for (let i = 0; i < 3; i++) {
  console.log(`\tGrupa ${['A', 'B', 'C'][i]}`);
  thirdPhase([a, b, c][i]);
}

console.log();
console.log('Konačan plasman u grupama:');
for (let i = 0; i < 3; i++) {
  console.log(`\tGrupa ${['A', 'B', 'C'][i]} (ime - wins/losses/points/scored/lost/difference)`);
  for (let j = 0; j < a.length; j++) {
    console.log(`\t\t${j + 1}. ${[a, b, c][i][j]['Team']}\t${[a, b, c][i][j].wins}/${[a, b, c][i][j].losses}/${[a, b, c][i][j].points}/${[a, b, c][i][j].goalsWon}/${[a, b, c][i][j].goalsLost}/${[a, b, c][i][j].goalsWon - [a, b, c][i][j].goalsLost}`);
  }

}
