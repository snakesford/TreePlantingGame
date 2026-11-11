const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
    constructor() {
        this.attrs = {};
        this.events = {};
        this.style = { setProperty() {} };
        this.classList = { add() {} };
        this.offsetWidth = 340;
        this.offsetHeight = 220;
    }
    setAttribute(key, value) { this.attrs[key] = value; }
    getAttribute(key) { return this.attrs[key]; }
    addEventListener(key, callback) { this.events[key] = callback; }
    replaceChildren(...children) {
        this.children = children;
        this.textContent = children.filter(child => typeof child === "string").join("");
    }
    append() {}
    remove() { this.removed = true; }
    prepend() {}
    show() { this.open = true; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    getBoundingClientRect() { return { left: 400, top: 400, width: 30, height: 30 }; }
}

function game(saved = null) {
    const elements = new Map();
    const storage = new Map(saved ? [['tree-planting-game-save', saved]] : []);
    const context = vm.createContext({
        document: {
            querySelector(selector) {
                if (!elements.has(selector)) elements.set(selector, new Element());
                return elements.get(selector);
            },
            createElement: () => new Element(),
            createElementNS: () => new Element(),
        },
        window: { addEventListener() {}, setInterval() {}, innerWidth: 1000, innerHeight: 800 },
        localStorage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value),
        },
        performance: { now: () => 0 },
        requestAnimationFrame() {},
        console,
    });
    vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../script.js'), 'utf8'), context);
    return { run: code => vm.runInContext(code, context), elements, storage };
}

const g = game();
g.elements.get('.plant-maple-button').events.click();
assert.equal(g.run('plantedSeeds[0].treeType'), 'maple');
assert.equal(g.run('moneyInCents'), 9999899);
g.run('openSeedDialog(plantedSeeds[0])');
assert.equal(g.elements.get('#seed-dialog-title').textContent, 'Maple Seed');
assert.equal(g.elements.get('.seed-upgrade-cost').textContent, '0.50');
assert.equal(g.elements.get('.seed-progress-bar').max, 4);
for (const [index, income, cost, days] of [
    [0, 40, 50, 2], [1, 60, 150, 2], [2, 100, 300, 3],
    [3, 140, 500, 3], [4, 175, 800, 4],
]) {
    assert.equal(g.run('plantedSeeds[0].stageIndex'), index);
    assert.equal(g.run('getGrowthStage(plantedSeeds[0]).earningInCents'), income);
    assert.equal(g.run('getFreeUpgradeInterval(plantedSeeds[0])'), days * 60000);
    for (let upgrade = 1; upgrade <= 4; upgrade++) {
        const balance = g.run('moneyInCents');
        g.run('upgradeSeed(plantedSeeds[0])');
        assert.equal(g.run('moneyInCents'), balance - cost);
        assert.equal(g.run('plantedSeeds[0].stageIndex'), index + (upgrade === 4 ? 1 : 0));
        assert.equal(g.run('plantedSeeds[0].upgradesInStage'), upgrade % 4);
        assert.equal(g.elements.get('.seed-progress-count').textContent,
            index === 4 && upgrade === 4 ? '4/4' : `${upgrade % 4}/4`);
    }
}
assert.equal(g.run('plantedSeeds[0].stageIndex'), 5);
assert.equal(g.run('getGrowthStage(plantedSeeds[0]).earningInCents'), 200);
assert.equal(g.run('getSeedUpgradeCost(plantedSeeds[0])'), 0);
assert.equal(g.run('getFreeUpgradeInterval(plantedSeeds[0])'), 0);
const balance = g.run('moneyInCents');
g.run('upgradeSeed(plantedSeeds[0])');
assert.equal(g.run('moneyInCents'), balance);
g.run('plantSeed("maple"); elapsedCycleTime = 119999; applyFreeSeedUpgrades()');
assert.equal(g.run('plantedSeeds[1].stageIndex'), 0);
g.run('elapsedCycleTime = 120000; applyFreeSeedUpgrades()');
assert.equal(g.run('plantedSeeds[1].stageIndex'), 0);
assert.equal(g.run('plantedSeeds[1].upgradesInStage'), 1);
g.run('elapsedCycleTime = 480000; applyFreeSeedUpgrades()');
assert.equal(g.run('plantedSeeds[1].stageIndex'), 1);
assert.equal(g.run('plantedSeeds[1].upgradesInStage'), 0);
g.run('elapsedCycleTime = 4800000; applyFreeSeedUpgrades()');
assert.equal(g.run('plantedSeeds[1].stageIndex'), 5);
g.run('plantSeed(); upgradeSeed(plantedSeeds[2])');
assert.equal(g.run('plantedSeeds[2].stageIndex'), 0);
assert.equal(g.run('plantedSeeds[2].upgradesInStage'), 1);
g.run('gameStarted = true; saveGame()');
const saved = g.storage.get('tree-planting-game-save');
const restored = game(saved);
restored.run('continueGame()');
assert.equal(restored.run('plantedSeeds[0].treeType'), 'maple');
assert.equal(restored.run('plantedSeeds[0].stageIndex'), 5);
const oldSave = JSON.parse(saved);
oldSave.seeds = oldSave.seeds.slice(2);
delete oldSave.seeds[0].treeType;
const legacy = game(JSON.stringify(oldSave));
legacy.run('continueGame()');
assert.equal(legacy.run('plantedSeeds[0].treeType'), 'standard');
g.run('moneyInCents = 0; updateMoneyDisplay(); plantSeed("maple")');
assert.equal(g.elements.get('.plant-maple-button').disabled, true);
assert.equal(g.run('plantedSeeds.length'), 3);
console.log('Maple planting, stage prices/income/timers, automatic growth, mature cap, saving, legacy saves, and affordability passed.');

const birch = game();
birch.elements.get('.plant-birch-button').events.click();
assert.equal(birch.run('plantedSeeds[0].treeType'), 'birch');
assert.equal(birch.run('moneyInCents'), 9999899);
const imageNames = ['seed', 'germination', 'sprout', 'seedling', 'sapling', 'adult'];
for (const [stage, income, cost, days] of [
    [0, 30, 100, 1], [1, 50, 200, 2], [2, 75, 300, 2],
    [3, 100, 500, 3], [4, 125, 700, 3], [5, 150, 0, 0],
]) {
    birch.run('openSeedDialog(plantedSeeds[0])');
    const imagePath = `images/birch/${imageNames[stage]}.png`;
    assert.ok(fs.existsSync(require('node:path').join(__dirname, '..', imagePath)));
    assert.equal(birch.run('plantedSeeds[0].image.getAttribute("href")'), imagePath);
    assert.equal(birch.elements.get('.seed-preview img').src, imagePath);
    assert.ok(birch.elements.get('#seed-dialog-title').textContent.startsWith('Birch '));
    assert.equal(birch.run('getGrowthStage(plantedSeeds[0]).earningInCents'), income);
    assert.equal(birch.run('getSeedUpgradeCost(plantedSeeds[0])'), cost);
    assert.equal(birch.run('getFreeUpgradeInterval(plantedSeeds[0])'), days * 60000);
    for (let upgrade = 1; upgrade <= 4; upgrade++) {
        const before = birch.run('moneyInCents');
        birch.run('upgradeSeed(plantedSeeds[0])');
        assert.equal(birch.run('moneyInCents'), before - cost);
        assert.equal(birch.run('plantedSeeds[0].stageIndex'), stage === 5 ? 5 : stage + (upgrade === 4 ? 1 : 0));
    }
}
birch.run('plantSeed("birch"); elapsedCycleTime = 60000; applyFreeSeedUpgrades()');
assert.equal(birch.run('plantedSeeds[1].stageIndex'), 0);
assert.equal(birch.run('plantedSeeds[1].upgradesInStage'), 1);
birch.run('gameStarted = true; saveGame()');
const loadedBirch = game(birch.storage.get('tree-planting-game-save'));
loadedBirch.run('continueGame()');
assert.equal(loadedBirch.run('plantedSeeds[1].treeType'), 'birch');
assert.equal(loadedBirch.run('plantedSeeds[1].upgradesInStage'), 1);
loadedBirch.run('elapsedCycleTime = 240000; applyFreeSeedUpgrades()');
assert.equal(loadedBirch.run('plantedSeeds[1].stageIndex'), 1);
birch.run('moneyInCents = 0; updateMoneyDisplay(); plantSeed("birch")');
assert.equal(birch.elements.get('.plant-birch-button').disabled, true);
assert.equal(birch.run('plantedSeeds.length'), 2);
console.log('Birch planting, all stage images/stats, four upgrades per stage, automatic growth, save/load, and affordability passed.');

const spruce = game();
spruce.elements.get('.plant-spruce-button').events.click();
assert.equal(spruce.run('plantedSeeds[0].treeType'), 'spruce');
assert.equal(spruce.run('moneyInCents'), 9999899);
for (const [stage, income, cost, days, image] of [
    [0, 25, 200, 3, 'seed'], [1, 50, 300, 4, 'germination'],
    [2, 100, 500, 5, 'sprout'], [3, 200, 800, 5, 'seedling'],
    [4, 300, 1200, 6, 'sapling'], [5, 400, 0, 0, 'adult'],
]) {
    spruce.run('openSeedDialog(plantedSeeds[0])');
    const path = `images/spruce/${image}.png`;
    assert.ok(fs.existsSync(require('node:path').join(__dirname, '..', path)));
    assert.equal(spruce.run('plantedSeeds[0].image.getAttribute("href")'), path);
    assert.equal(spruce.elements.get('.seed-preview img').src, path);
    assert.ok(spruce.elements.get('#seed-dialog-title').textContent.startsWith('Spruce '));
    assert.equal(spruce.run('getGrowthStage(plantedSeeds[0]).earningInCents'), income);
    assert.equal(spruce.run('getFreeUpgradeInterval(plantedSeeds[0])'), days * 60000);
    assert.equal(spruce.run('getSeedUpgradeCost(plantedSeeds[0])'), cost);
    for (let upgrade = 1; upgrade <= 4; upgrade++) {
        const before = spruce.run('moneyInCents');
        spruce.run('upgradeSeed(plantedSeeds[0])');
        assert.equal(spruce.run('moneyInCents'), before - cost);
        assert.equal(spruce.run('plantedSeeds[0].stageIndex'), stage === 5 ? 5 : stage + (upgrade === 4 ? 1 : 0));
    }
}
spruce.run('plantSeed("spruce"); elapsedCycleTime = 180000; applyFreeSeedUpgrades(); gameStarted = true; saveGame()');
assert.equal(spruce.run('plantedSeeds[1].upgradesInStage'), 1);
const loadedSpruce = game(spruce.storage.get('tree-planting-game-save'));
loadedSpruce.run('continueGame()');
assert.equal(loadedSpruce.run('plantedSeeds[1].treeType'), 'spruce');
assert.equal(loadedSpruce.run('plantedSeeds[1].upgradesInStage'), 1);
loadedSpruce.run('elapsedCycleTime = 720000; applyFreeSeedUpgrades()');
assert.equal(loadedSpruce.run('plantedSeeds[1].stageIndex'), 1);
spruce.run('moneyInCents = 0; updateMoneyDisplay(); plantSeed("spruce")');
assert.equal(spruce.elements.get('.plant-spruce-button').disabled, true);
assert.equal(spruce.run('plantedSeeds.length'), 2);
console.log('Spruce planting, stage images/stats, four upgrades, automatic growth, save/load, and affordability passed.');

const oak = game();
oak.elements.get('.plant-oak-button').events.click();
assert.equal(oak.run('plantedSeeds[0].treeType'), 'oak');
assert.equal(oak.run('moneyInCents'), 9999699);
for (const [stage, income, cost, days, image] of [
    [0, 20, 300, 4, 'seed'], [1, 40, 500, 5, 'germination'],
    [2, 75, 800, 6, 'sprout'], [3, 150, 1200, 8, 'seedling'],
    [4, 300, 2000, 10, 'sapling'], [5, 600, 0, 0, 'adult'],
]) {
    oak.run('openSeedDialog(plantedSeeds[0])');
    const path = `images/oak/${image}.png`;
    assert.ok(fs.existsSync(require('node:path').join(__dirname, '..', path)));
    assert.equal(oak.run('plantedSeeds[0].image.getAttribute("href")'), path);
    assert.equal(oak.elements.get('.seed-preview img').src, path);
    assert.ok(oak.elements.get('#seed-dialog-title').textContent.startsWith('Oak '));
    assert.equal(oak.run('getGrowthStage(plantedSeeds[0]).earningInCents'), income);
    assert.equal(oak.run('getFreeUpgradeInterval(plantedSeeds[0])'), days * 60000);
    assert.equal(oak.run('getSeedUpgradeCost(plantedSeeds[0])'), cost);
    for (let upgrade = 1; upgrade <= 4; upgrade++) {
        const before = oak.run('moneyInCents');
        oak.run('upgradeSeed(plantedSeeds[0])');
        assert.equal(oak.run('moneyInCents'), before - cost);
        assert.equal(oak.run('plantedSeeds[0].stageIndex'), stage === 5 ? 5 : stage + (upgrade === 4 ? 1 : 0));
    }
}
oak.run('plantSeed("oak"); elapsedCycleTime = 240000; applyFreeSeedUpgrades(); gameStarted = true; saveGame()');
assert.equal(oak.run('plantedSeeds[1].upgradesInStage'), 1);
const loadedOak = game(oak.storage.get('tree-planting-game-save'));
loadedOak.run('continueGame()');
assert.equal(loadedOak.run('plantedSeeds[1].treeType'), 'oak');
assert.equal(loadedOak.run('plantedSeeds[1].upgradesInStage'), 1);
loadedOak.run('elapsedCycleTime = 960000; applyFreeSeedUpgrades()');
assert.equal(loadedOak.run('plantedSeeds[1].stageIndex'), 1);
oak.run('moneyInCents = 299; updateMoneyDisplay(); plantSeed("oak")');
assert.equal(oak.elements.get('.plant-oak-button').disabled, true);
assert.equal(oak.run('plantedSeeds.length'), 2);
console.log('Oak planting, stage images/stats, four upgrades, automatic growth, save/load, and affordability passed.');

oak.run('moneyInCents = 300; updateMoneyDisplay()');
assert.equal(oak.elements.get('.plant-oak-button').disabled, false);
oak.elements.get('.plant-oak-button').events.click();
assert.equal(oak.run('moneyInCents'), 0);
assert.equal(oak.run('plantedSeeds.length'), 3);
oak.run('moneyInCents = 300; availableTiles.length = 0; updateMoneyDisplay(); plantSeed("oak")');
assert.equal(oak.elements.get('.plant-oak-button').disabled, true);
assert.equal(oak.run('plantedSeeds.length'), 3);

for (const treeType of ['standard', 'maple', 'birch', 'spruce', 'oak']) {
    const previousSave = JSON.parse(saved);
    previousSave.version = 1;
    previousSave.seeds = [{ ...previousSave.seeds[0], treeType, stageIndex: 6, upgradesInStage: 2 }];
    const migrated = game(JSON.stringify(previousSave));
    migrated.run('continueGame(); openSeedDialog(plantedSeeds[0])');
    assert.equal(migrated.run('plantedSeeds[0].stageIndex'), 5);
    assert.equal(migrated.run('plantedSeeds[0].upgradesInStage'), 0);
    assert.equal(migrated.elements.get('.seed-upgrade-cost').textContent, 'Grown');
    assert.ok(migrated.elements.get('#seed-dialog-title').textContent.includes('Mature'));
    const before = migrated.run('moneyInCents');
    migrated.run('upgradeSeed(plantedSeeds[0]); elapsedCycleTime += 100000000; applyFreeSeedUpgrades()');
    assert.equal(migrated.run('moneyInCents'), before);
    assert.equal(migrated.run('plantedSeeds[0].stageIndex'), 5);
    const updatedSave = JSON.parse(migrated.storage.get('tree-planting-game-save'));
    assert.equal(updatedSave.version, 2);
    assert.equal(updatedSave.seeds[0].stageIndex, 5);
    assert.equal(migrated.run('getSeedUpgradeCost(plantedSeeds[0])'), 0);
    assert.equal(migrated.run('getFreeUpgradeInterval(plantedSeeds[0])'), 0);
}
console.log('Retired-stage save migration and Mature growth cap passed for all five tree types.');

const sizing = game();
for (const type of ['maple', 'birch', 'spruce', 'oak']) {
    sizing.run(`plantSeed('${type}')`);
    let previousSize = 0;
    for (let upgrade = 0; upgrade <= 20; upgrade++) {
        const width = sizing.run('plantedSeeds.at(-1).image.getAttribute("width")');
        assert.ok(width > previousSize, 'Every upgrade should increase image size');
        // At each square corner: |y| + |x| / sqrt(3) must stay inside the hex.
        assert.ok(width / 2 * (1 + 1 / Math.sqrt(3)) <= 22.75 + 1e-9);
        assert.equal(sizing.run('plantedSeeds.at(-1).image.getAttribute("x") + plantedSeeds.at(-1).image.getAttribute("width") / 2 - plantedSeeds.at(-1).x'), 0);
        previousSize = width;
        sizing.run('upgradeSeed(plantedSeeds.at(-1))');
    }
}
console.log('All tree images grow with each upgrade and remain centered inside their hex.');

const hover = game();
hover.run('plantSeed(); openSeedDialog(plantedSeeds[0], { clientX: 500, clientY: 500 })');
assert.equal(hover.elements.get('.seed-dialog').style.left, '330px');
assert.equal(hover.elements.get('.seed-dialog').style.top, '232px');
hover.run('plantedSeeds[0].image.events.mousemove({ clientX: 990, clientY: 10 })');
assert.equal(hover.elements.get('.seed-dialog').style.left, '652px');
assert.equal(hover.elements.get('.seed-dialog').style.top, '8px');
hover.run('addTileObstacle(0, 0, "rock"); openObstacleDialog("0,0", { clientX: 500, clientY: 500 })');
assert.equal(hover.elements.get('.obstacle-dialog').style.left, '330px');
assert.equal(hover.elements.get('.obstacle-dialog').style.top, '232px');
assert.equal(hover.elements.get('.seed-dialog').open, false);
console.log('Tree and obstacle hover cards position above the cursor and clamp to screen edges.');

const currency = game();
currency.run('plantSeed(); openSeedDialog(plantedSeeds[0])');
for (const selector of ['.seed-upgrade-cost', '.sprout-description']) {
    const icon = currency.elements.get(selector).children.find(child => child instanceof Element);
    assert.equal(icon.src, 'images/leaf.png');
    assert.equal(icon.alt, 'leaves');
    assert.ok(!currency.elements.get(selector).textContent.includes('$'));
}
currency.run('addTileObstacle(0, 0, "rock"); openObstacleDialog("0,0")');
assert.equal(currency.elements.get('.obstacle-description').textContent, 'Click to remove for 10.00.');
assert.equal(currency.elements.get('.obstacle-description').children[1].src, 'images/leaf.png');
console.log('Leaf currency icons render in dynamic costs and earnings.');

for (const type of ['maple', 'birch', 'spruce', 'oak']) {
    for (let stage = 0; stage <= 5; stage++) {
        const compost = game();
        const initialTiles = compost.run('availableTiles.length');
        compost.run(`plantSeed('${type}'); plantedSeeds[0].stageIndex = ${stage}; openSeedDialog(plantedSeeds[0]); gameStarted = true`);
        const reward = compost.run('getGrowthStage(plantedSeeds[0]).earningInCents') * (stage + 1);
        assert.equal(compost.elements.get('.seed-compost-info').textContent,
            `Right-click to compost for ${(reward / 100).toFixed(2)} (${stage + 1}× earnings).`);
        const balance = compost.run('moneyInCents');
        const tree = compost.run('plantedSeeds[0]');
        let prevented = false;
        tree.image.events.contextmenu({ preventDefault() { prevented = true; }, stopPropagation() {} });
        assert.equal(prevented, true);
        assert.equal(tree.image.removed, true);
        assert.equal(compost.run('moneyInCents'), balance + reward);
        assert.equal(compost.run('plantedSeeds.length'), 0);
        assert.equal(compost.run('availableTiles.length'), initialTiles);
        assert.equal(compost.elements.get('.seed-dialog').open, false);
        tree.image.events.contextmenu({ preventDefault() {}, stopPropagation() {} });
        assert.equal(compost.run('moneyInCents'), balance + reward);
        const reloaded = game(compost.storage.get('tree-planting-game-save'));
        reloaded.run('continueGame()');
        assert.equal(reloaded.run('plantedSeeds.length'), 0);
        assert.equal(reloaded.run('moneyInCents'), balance + reward);
        compost.run('plantSeed()');
        assert.equal(compost.run('plantedSeeds.length'), 1);
    }
}
console.log('Right-click composting rewards, tile reuse, duplicate protection, and persistence passed for all tree types and stages.');

const removedBaseSeed = game();
removedBaseSeed.run('plantSeed("standard")');
assert.equal(removedBaseSeed.run('plantedSeeds.length'), 0);
removedBaseSeed.run('plantSeed()');
assert.equal(removedBaseSeed.run('plantedSeeds[0].treeType'), 'maple');
assert.ok(!fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8').includes('class="plant-button"'));
console.log('Base seed purchase removed; default planting uses maple.');
