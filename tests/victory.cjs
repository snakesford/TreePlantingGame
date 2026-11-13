const fs = require('node:fs');
const vm = require('node:vm');
// Reuse the existing DOM/game harness without running unrelated campaign tests.
const harness = fs.readFileSync(`${__dirname}/maple.cjs`, 'utf8').split('const clock = game();')[0];
vm.runInNewContext(harness + `
const session = game();
session.run(\`
    normalMode = true;
    gameStarted = true;
    activeBoardColors = ['green', 'red', 'blue'];
    humanColor = selectedColor = 'green';
    playerStates = activeBoardColors.map(color => ({ color, seedType: 'maple', moneyInCents: 0 }));
    plantedSeeds.length = 0;
    boardTileCoordinates.length = 0;
    tileOwnership.clear();
    for (let q = 0; q < 20; q += 1) {
        const tile = { q, r: 0 };
        boardTileCoordinates.push(tile);
        tileOwnership.set(getTileKey(q, 0), 'green');
        tileTerrain.set(getTileKey(q, 0), 'normal');
        plantedSeeds.push({ tile, treeType: 'maple', stageIndex: maximumGrowthStage });
    }
    const redTile = { q: -4, r: 0 };
    boardTileCoordinates.push(redTile);
    tileOwnership.set(getTileKey(-4, 0), 'red');
    plantedSeeds.push({ tile: redTile, treeType: 'oak', stageIndex: 0 });
\`);
const results = session.run('getPlayerVictoryProgress(playerStates[0])');
assert.equal(results[0].name, '🌳 Growth Victory');
assert.equal(results[0].progress, 1);
assert.equal(results.find(c => c.name.includes('Ecological')).detail, '20 / 30 connected trees');
assert.equal(results.find(c => c.name.includes('Economic')).progress, 0.4);
assert.equal(session.run('getPlayerVictoryProgress(playerStates[1]).find(c => c.name.includes("Ecological")).detail'), '1 / 30 connected trees');
session.run('tileOwnership.set(getTileKey(10, 0), "red")');
assert.equal(session.run('getPlayerVictoryProgress(playerStates[0]).find(c => c.name.includes("Ecological")).detail'), '10 / 30 connected trees');
session.run('playerStates[1].eliminated = true');
assert.equal(session.run('getPlayerVictoryProgress(playerStates[0]).find(c => c.name.includes("Domination")).progress'), 0);
assert.equal(session.run('getPlayerVictoryProgress(playerStates[1]).every(c => c.progress === 0)'), true);
session.run('updatePlayerRoster()');
const cards = session.elements.get('.player-roster').children;
assert.equal(cards.length, 3);
for (const card of cards) assert.equal(card.children[1].children.length, 3);
session.run('plantedSeeds.forEach(seed => { seed.image = document.createElement("image"); seed.upgradesInStage = 0; Object.assign(seed, getTileCenter(seed.tile.q, seed.tile.r)); }); tileOwnership.set(getTileKey(10, 0), "green"); checkVictory()');
assert.equal(session.run('victory.color'), 'green');
assert.equal(session.run('victory.status'), 'pending');
assert.equal(session.elements.get('.victory-dialog').open, true);
assert.equal(session.run('canAct()'), false);
session.elements.get('.victory-continue').events.click();
assert.equal(session.run('victory.status'), 'continued');
assert.equal(session.elements.get('.victory-dialog').open, false);
session.run('checkVictory()');
assert.equal(session.elements.get('.victory-dialog').open, false);
assert.equal(session.run('canAct()'), true);
assert.equal(JSON.parse(session.storage.get('tree-planting-game-save')).victory.status, 'continued');
// A bot reaching a target gets the same choice; finishing locks play and saves the winner.
session.run('victory = null; playerStates[1].eliminated = false; tileOwnership.forEach((color, key) => tileOwnership.set(key, "red")); checkVictory()');
assert.equal(session.run('victory.color'), 'red');
assert.match(session.elements.get('#victory-title').textContent, /Red.*bot.*wins/);
session.elements.get('.victory-finish').events.click();
assert.equal(session.run('gameIsOver()'), true);
assert.equal(session.run('canAct()'), false);
assert.equal(session.elements.get('.done-button').disabled, true);
assert.equal(session.elements.get('.turn-indicator').textContent, 'Red wins!');
assert.equal(JSON.parse(session.storage.get('tree-planting-game-save')).victory.status, 'finished');
console.log('Victory ranking, player/bot messages, pause, keep playing, finish, and saved choices passed.');
`, { require, __dirname, console });
