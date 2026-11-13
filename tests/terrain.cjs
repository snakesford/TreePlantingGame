const fs = require('node:fs');
const vm = require('node:vm');
const harness = fs.readFileSync(`${__dirname}/maple.cjs`, 'utf8').split('const clock = game();')[0];
vm.runInNewContext(harness + `
const session = game();
session.run("startNewGame(false, 'green', false, 'maple')");
assert.equal(session.run('tileTerrain.size'), 91);
for (const [type, count] of [['normal', 63], ['dry', 14], ['lush', 14]]) {
    assert.equal(session.run('Array.from(tileTerrain.values()).filter(type => type === "' + type + '").length'), count);
}
assert.equal(session.run('Array.from(tileElements, ([key, tile]) => tile.getAttribute("data-terrain") === tileTerrain.get(key)).every(Boolean)'), true);
assert.equal(session.run('Array.from(purchaseTileElements, ([key, tile]) => tile.getAttribute("data-terrain") === tileTerrain.get(key)).every(Boolean)'), true);
session.run('saveGame()');
const saved = session.storage.get('tree-planting-game-save');
const restored = game(saved);
assert.equal(restored.run('JSON.stringify(Array.from(tileTerrain))'), session.run('JSON.stringify(Array.from(tileTerrain))'));
const legacy = JSON.parse(saved);
delete legacy.tileTerrain;
assert.equal(game(JSON.stringify(legacy)).run('tileTerrain.size'), 91);
session.run('victory = null; const testSeed = plantedSeeds[0];');
for (const [terrain, income, increment, clicks, remainder] of [
    ['normal', 40, 1, 4, 0], ['lush', 46, 1.15, 4, 0.6], ['dry', 34, 0.85, 5, 0.25]
]) {
    session.run('testSeed.stageIndex = 0; testSeed.upgradesInStage = 0; tileTerrain.set(getTileKey(testSeed.tile.q, testSeed.tile.r), "' + terrain + '");');
    assert.equal(session.run('getTreeIncome(testSeed)'), income);
    session.run('advanceSeedGrowth(testSeed)');
    assert.equal(session.run('testSeed.upgradesInStage'), increment);
    const fractionalSave = session.storage.get('tree-planting-game-save');
    assert.equal(session.run('isValidSaveData(JSON.parse(localStorage.getItem(saveStorageKey)))'), true);
    assert.equal(game(fractionalSave).run('plantedSeeds[0].upgradesInStage'), increment);
    for (let i = 1; i < clicks; i++) session.run('advanceSeedGrowth(testSeed)');
    assert.equal(session.run('testSeed.stageIndex'), 1);
    assert.equal(session.run('testSeed.upgradesInStage'), remainder);
    session.run('testSeed.stageIndex = maximumGrowthStage - 1; testSeed.upgradesInStage = 3.9; advanceSeedGrowth(testSeed); advanceSeedGrowth(testSeed)');
    assert.equal(session.run('testSeed.stageIndex'), 5);
    assert.equal(session.run('testSeed.upgradesInStage'), 0);
}
session.run('testSeed.stageIndex = 0; tileTerrain.set(getTileKey(testSeed.tile.q, testSeed.tile.r), "lush"); tileObstacles.set(getTileKey(testSeed.tile.q, testSeed.tile.r), { key: "river" })');
assert.equal(session.run('getTreeIncome(testSeed)'), 92, 'Terrain bonus combines with river income');
console.log('Terrain quotas, income, growth carryover, maturity, river stacking, and save/load passed.');
`, { require, __dirname, console });
