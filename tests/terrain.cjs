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
console.log('Terrain quotas, owned/unclaimed tiles, persistence, and legacy saves passed.');
`, { require, __dirname, console });
