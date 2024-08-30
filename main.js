const fs = require('fs');
const data = fs.readFileSync('groups.json', 'utf8');
const data2 = fs.readFileSync('exibitions.json', 'utf8');
const groups = JSON.parse(data);
const exibitions = JSON.parse(data2);
const K_FACTOR = 32;
const [quarters, semi, bronze, finals, medals] = [[], [], [], [], []];
let ranked = [];

const initializeValues = (grp) => {
  for (let i of grp) {
    [i.wins, i.losses, i.points, i.goalsWon, i.goalsLost, i.elo, i.matches] = [0, 0, 0, 0, 0, 0, []];
  }
};

const updateEloRating = (rating1, rating2, actualScore) => {
  const expectedScore = calculateExpectedScore(rating1, rating2);

  return rating1 + K_FACTOR * (actualScore - expectedScore);
}

const calculateExpectedScore = (rating1, rating2) => {
  return 1 / (1 + Math.pow(10, (rating1 - rating2) / 10));
}

// use elo rating as the leading factor
const adjustWithElo = (fiba1, fiba2, rating1, rating2) => {
  const eloFactor = (rating2 - rating1) / 10;
  const fiba = fiba1 + eloFactor * 10;

  return calculateExpectedScore(fiba, fiba2);
}

// use fiba rating as the leading factor
const adjustWithFiba = (rating1, rating2, fiba1, fiba2) => {
  const fibaFactor = (fiba2 - fiba1) / 10;
  const rating = rating1 + fibaFactor * 10;

  return calculateExpectedScore(rating, rating2);
};

const generateEloRating = (grp) => {
  for (let i in grp) {
    grp[i].elo = 0;

    for (let j in exibitions) {
      if (grp[i]['ISOCode'] === j) {

        for (let k = 0; k < 2; k++) {
          const score = [];
          const result = exibitions[j][k]['Result'].split('-');

          score.push(parseInt(result[0]), parseInt(result[1]));
          if (score[0] > score[1]) grp[i].elo++;
          if (score[2] > score[3]) grp[i].elo++;
        }
      }
    }
  }
};

const simulateGame = (team1, team2) => {
  const score = [];
  const probability = adjustWithFiba(team1.elo, team2.elo, team1['FIBARanking'], team2['FIBARanking']);
  const random = Math.random();
  const winner = random < probability ? team1 : team2;

  if (winner['ISOCode'] === team1['ISOCode']) {
    let [val1, val2] = [0, 0];

    do {
      val1 = Math.round(Math.random() * 200);
    } while (val1 === 0);

    do {
      val2 = Math.round(Math.random() * 200);
    } while (val2 >= val1);

    updateStats(team1, team2, val1, val2);
    score.push(val1, val2);
    team1.elo = updateEloRating(team1.elo, team2.elo, 1);
    team2.elo = updateEloRating(team2.elo, team1.elo, 0);
  } else if (winner['ISOCode'] === team2['ISOCode']) {
    let [val1, val2] = [0, 0];

    do {
      val2 = Math.round(Math.random() * 200);
    } while (val2 === 0);

    do {
      val1 = Math.round(Math.random() * 200);
    } while (val1 >= val2);

    updateStats(team2, team1, val2, val1);
    score.push(val1, val2);
    team2.elo = updateEloRating(team2.elo, team1.elo, 1);
    team1.elo = updateEloRating(team1.elo, team2.elo, 0);
  }

  console.log(`\t\t${team1['Team']} - ${team2['Team']} [${score[0]} : ${score[1]}]`);

  return [score[0], score[1]];
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
    if (a.points === b.points) {
      for (let j of a.matches) {
        if (j.opponent === b['ISOCode']) {
          return 0 - j.outcome;
        }
      }
    }
    return b.points - a.points;
  });
}

const elimination = (a, b) => {
  const [checker, match, match2, opponents] = [[], [], [], []];

  for (let i = 0; i < a[0].matches.length; i++) {
    checker.push(a[0].matches[i].opponent);
  }

  for (let i of b) {
    if (checker.some((iso) => iso === i['ISOCode'])) continue;

    opponents.push(i);
  }

  match.push(a[0], opponents[Math.round(Math.random() * (opponents.length - 1))]);


  (match[1]['ISOCode'] === b[0]['ISOCode']) ? b.shift() : b.pop();

  match2.push(a[1], b[0]);
  quarters.push([match[0], match[1]], [match2[0], match2[1]]);

  console.log();
  console.log(`\t${match[0]['Team']} - ${match[1]['Team']}`);
  console.log(`\t${match2[0]['Team']} - ${match2[1]['Team']}`)
};

const quarterFinals = (team1, team2) => {
  const score = simulateGame(team1, team2);

  (score[0] > score[1]) ? semi.push(team1) : semi.push(team2);
};

const semiFinals = (team1, team2) => {
  const score = simulateGame(team1, team2);

  if (score[0] > score[1]) {
    finals.push(team1);
    bronze.push(team2);
  } else {
    finals.push(team2);
    bronze.push(team1);
  }
};

const thirdPlace = (team1, team2) => {
  const score = simulateGame(team1, team2);

  (score[0] > score[1]) ? medals.push(team1) : medals.push(team2);
};

const simulateFinals = (team1, team2) => {
  const score = simulateGame(team1, team2);

  (score[0] > score[1]) ? medals.unshift(team1, team2) : medals.unshift(team2, team1);
}

const updateStats = (team1, team2, val1, val2) => {
  team1.wins++;
  team1.points += 2;
  team1.goalsWon += val1;
  team1.goalsLost += val2;
  team1.matches.push({ opponent: team2['ISOCode'], outcome: val1 - val2 });
  team2.losses++;
  team2.points++;
  team2.goalsWon += val2;
  team2.goalsLost += val1;
  team2.matches.push({ opponent: team1['ISOCode'], outcome: val2 - val1 });
};

const rankTeams = (a, b, c) => {
  const tmp = [];
  tmp.push(a, b, c);

  tmp.sort((a, b) => {
    if (a.points === b.points) {
      if ((a.goalsWon - a.goalsLost) === (b.goalsWon - b.goalsLost)) {
        return b.goalsWon - a.goalsWon;
      }

      return (b.goalsWon - b.goalsLost) - (a.goalsWon - a.goalsLost);
    }

    return b.points - a.points;
  });

  ranked.push(tmp[0], tmp[1], tmp[2]);
};


const simulate = () => {
  const [a, b, c] = [groups['A'], groups['B'], groups['C']];
  const [d, e, f, g] = [[], [], [], []];

  for (let i = 0; i < 3; i++) {
    initializeValues([a, b, c][i]);
  }

  for (let i = 0; i < 3; i++) {
    generateEloRating([a, b, c][i]);
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

  for (let i = 0; i < 3; i++) {
    rankTeams(a[i], b[i], c[i]);
  }

  d.push(ranked[0], ranked[1]);
  e.push(ranked[2], ranked[3]);
  f.push(ranked[4], ranked[5]);
  g.push(ranked[6], ranked[7]);

  console.log();
  console.log('Šeširi:');
  for (let i = 0; i < 4; i++) {
    console.log(`\tŠešir ${['D', 'E', 'F', 'G'][i]}:`)
    for (let j = 0; j < 2; j++) {
      console.log(`\t\t${[d, e, f, g][i][j]['Team']}`);
    }
  }

  console.log('Eliminaciona faza:');
  elimination(d, g);
  elimination(e, f);

  console.log();
  console.log('Četvrtfinale:');
  quarterFinals(quarters[0][0], quarters[0][1]);
  quarterFinals(quarters[1][0], quarters[1][1]);
  console.log();
  quarterFinals(quarters[2][0], quarters[2][1]);
  quarterFinals(quarters[3][0], quarters[3][1]);

  console.log();
  console.log("Polufinale:");
  semiFinals(semi[0], semi[1]);
  semiFinals(semi[2], semi[3]);

  console.log();
  console.log('Utakmica za treće mesto:');
  thirdPlace(bronze[0], bronze[1]);

  console.log();
  console.log('Finale:');
  simulateFinals(finals[0], finals[1]);

  console.log();
  console.log('Medalje:');
  for (let i = 0; i < medals.length; i++) {
    console.log(`\t${i + 1}. ${medals[i]['Team']}`);
  }
};

simulate();
