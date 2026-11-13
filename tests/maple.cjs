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
    setPointerCapture(pointerId) { this.capturedPointer = pointerId; }
    replaceChildren(...children) {
        this.children = children;
        this.textContent = children.filter(child => typeof child === "string").join("");
    }
    append() {}
    remove() { this.removed = true; }
    prepend() {}
    show() { this.open = true; }
    focus() { this.focused = true; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    getBoundingClientRect() { return { left: 400, top: 400, width: 30, height: 30 }; }
}

function game(saved = null) {
    const elements = new Map();
    const storage = new Map(saved ? [['tree-planting-game-save', saved]] : []);
    const tileContainer = new Element();
    tileContainer.ownerSVGElement = new Element();
    elements.set(".hex-tiles", tileContainer);
    const context = vm.createContext({
        document: {
            querySelector(selector) {
                if (!elements.has(selector)) elements.set(selector, new Element());
                return elements.get(selector);
            },
            createElement: () => new Element(),
            createElementNS: () => new Element(),
        },
        window: { addEventListener() {}, setInterval() {}, setTimeout() {}, innerWidth: 1000, innerHeight: 800 },
        localStorage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value),
            removeItem: key => storage.delete(key),
        },
        performance: { now: () => 0 },
        requestAnimationFrame() {},
        console,
    });
    vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../script.js'), 'utf8'), context);
    elements.get('.hex-tiles').ownerSVGElement = new Element();
    // Fund upgrade and campaign fixtures independently of the game's starting balance.
    if (!saved) vm.runInContext('moneyInCents = 9999999; selectedColor = "green"; normalMode = false', context);
    return { run: code => vm.runInContext(code, context), elements, storage };
}

const g = game();
const tutorial = game();
assert.notEqual(tutorial.elements.get('.save-slot-dialog').open, true);
tutorial.elements.get('.tutorial-button').events.click();
assert.equal(tutorial.elements.get('.save-slot-dialog').open, false);
assert.equal(tutorial.run('gameStarted'), true);
assert.equal(tutorial.elements.get('.tutorial-welcome-dialog').open, true);
assert.equal(tutorial.elements.get('.game-actions .tutorial-plant-prompt').hidden, true);
tutorial.run('window.setTimeout = (callback, delay) => { window.pendingPrompt = callback; window.promptDelay = delay; }');
tutorial.elements.get('.tutorial-welcome-dismiss').events.click();
assert.equal(tutorial.elements.get('.tutorial-welcome-dialog').open, false);
// The browser dispatches close after dialog.close().
tutorial.elements.get('.tutorial-welcome-dialog').events.close();
assert.equal(tutorial.elements.get('.game-actions .tutorial-plant-prompt').hidden, true);
assert.equal(tutorial.run('window.promptDelay'), 700);
tutorial.run('window.pendingPrompt()');
assert.equal(tutorial.elements.get('.tutorial-done-prompt').hidden, false);
assert.equal(tutorial.elements.get('.game-actions .tutorial-plant-prompt').hidden, true);
tutorial.elements.get('.tutorial-done-next').events.click();
assert.equal(tutorial.elements.get('.tutorial-done-prompt').hidden, true);
assert.equal(tutorial.elements.get('.game-actions .tutorial-plant-prompt').hidden, true);
tutorial.run('window.pendingPrompt()');
assert.equal(tutorial.elements.get('.game-actions .tutorial-plant-prompt').hidden, false);
assert.equal(tutorial.elements.get('.level-indicator').hidden, true);
assert.equal(tutorial.elements.get('.level-details').hidden, true);
assert.equal(tutorial.run('boardTileCoordinates.length'), 1);
assert.equal(tutorial.run('tileObstacles.size'), 0);
assert.equal(tutorial.run('plantedSeeds.length'), 0);
assert.equal(tutorial.run('availableTiles.length'), 1);
assert.equal(tutorial.elements.get('.plant-maple-button').hidden, false);
assert.equal(tutorial.elements.get('.plant-maple-button').disabled, false);
for (const selector of ['.plant-birch-button', '.plant-spruce-button', '.plant-oak-button', '.buy-tile-button']) {
    assert.equal(tutorial.elements.get(selector).hidden, true);
}
const tutorialSave = tutorial.storage.get('tree-planting-game-save');
const resumedTutorial = game(tutorialSave);
resumedTutorial.elements.get('.continue-game-button').events.click();
assert.equal(resumedTutorial.run('gameStarted'), true);
assert.equal(resumedTutorial.elements.get('.level-indicator').hidden, true);
assert.equal(resumedTutorial.elements.get('.level-details').hidden, true);
assert.equal(resumedTutorial.run('boardTileCoordinates.length'), 1);
assert.equal(resumedTutorial.run('plantedSeeds.length'), 0);
assert.equal(resumedTutorial.elements.get('.plant-birch-button').hidden, true);
resumedTutorial.run('window.setTimeout = (callback, delay) => { window.pendingUpgradePrompt = callback; window.upgradePromptDelay = delay; }');
resumedTutorial.elements.get('.plant-maple-button').events.click();
assert.equal(resumedTutorial.run('plantedSeeds.length'), 1);
assert.equal(resumedTutorial.run('plantedSeeds[0].treeType'), 'maple');
assert.equal(resumedTutorial.elements.get('.tutorial-upgrade-prompt').hidden, true);
assert.equal(resumedTutorial.run('window.upgradePromptDelay'), 700);
resumedTutorial.run('window.pendingUpgradePrompt()');
assert.equal(resumedTutorial.elements.get('.tutorial-upgrade-prompt').hidden, false);
assert.equal(resumedTutorial.elements.get('.game-actions .tutorial-plant-prompt').hidden, true);
resumedTutorial.run('upgradeSeed(plantedSeeds[0])');
assert.equal(resumedTutorial.elements.get('.tutorial-upgrade-prompt').hidden, true);
assert.equal(resumedTutorial.run('tileObstacles.size'), 0);
assert.equal(resumedTutorial.elements.get('.tutorial-sprout-prompt').hidden, false);
resumedTutorial.run('moneyInCents = 2000; while (plantedSeeds[0].stageIndex < 2) upgradeSeed(plantedSeeds[0])');
assert.equal(resumedTutorial.elements.get('.tutorial-sprout-prompt').hidden, true);
assert.equal(resumedTutorial.elements.get('.tutorial-compost-prompt').hidden, true);
assert.equal(resumedTutorial.run('window.upgradePromptDelay'), 700);
resumedTutorial.run('window.pendingUpgradePrompt()');
assert.equal(resumedTutorial.elements.get('.tutorial-compost-prompt').hidden, false);
const beforeTutorialCompost = resumedTutorial.run('moneyInCents');
const tutorialCompostReward = resumedTutorial.run('getCompostReward(plantedSeeds[0])');
resumedTutorial.run('compostTree(plantedSeeds[0])');
assert.equal(resumedTutorial.run('moneyInCents'), beforeTutorialCompost + tutorialCompostReward);
assert.equal(resumedTutorial.elements.get('.money-counter').getAttribute('data-compost-highlight'), 'true');
assert.equal(resumedTutorial.elements.get('.compost-reward').hidden, false);
assert.equal(resumedTutorial.run('window.upgradePromptDelay'), 3500);
resumedTutorial.run('window.pendingUpgradePrompt()');
assert.equal(resumedTutorial.elements.get('.money-counter').getAttribute('data-compost-highlight'), 'false');
assert.equal(resumedTutorial.elements.get('.compost-reward').hidden, true);
assert.equal(resumedTutorial.elements.get('.tutorial-compost-prompt').hidden, true);
assert.equal(resumedTutorial.elements.get('.game-actions .tutorial-plant-prompt').hidden, true);
const completedTutorial = game(resumedTutorial.storage.get('tree-planting-game-save'));
completedTutorial.run('continueGame()');
assert.equal(completedTutorial.run('tutorialCompleted'), true);
assert.equal(completedTutorial.elements.get('.game-actions .tutorial-plant-prompt').hidden, true);
const skippedTutorial = game();
skippedTutorial.elements.get('.new-game-button').events.click({ type: 'click' });
assert.equal(skippedTutorial.elements.get('.color-dialog').open, true);
skippedTutorial.elements.get('.choose-green').events.click();
skippedTutorial.elements.get('.choose-seed-maple').events.click();
skippedTutorial.elements.get('.setup-done-button').events.click();
assert.equal(skippedTutorial.run('boardTileCoordinates.length'), 22);
assert.equal(skippedTutorial.run('plantedSeeds.length'), 3);
assert.equal(skippedTutorial.elements.get('.level-indicator').hidden, true);
assert.equal(skippedTutorial.elements.get('.level-details').hidden, true);
assert.equal(skippedTutorial.elements.get('.plant-birch-button').hidden, true);
const refreshedModeMenu = game(tutorialSave);
assert.notEqual(refreshedModeMenu.elements.get('.save-slot-dialog').open, true);
refreshedModeMenu.run('window.confirm = () => true');
refreshedModeMenu.elements.get('.new-game-button').events.click();
refreshedModeMenu.elements.get('.choose-green').events.click();
refreshedModeMenu.elements.get('.choose-seed-maple').events.click();
refreshedModeMenu.elements.get('.setup-done-button').events.click();
assert.equal(refreshedModeMenu.elements.get('.save-slot-dialog').open, false);
assert.equal(refreshedModeMenu.run('boardTileCoordinates.length'), 22);
assert.equal(refreshedModeMenu.run('boardTileKeys.has("0,0")'), true);
for (const color of ['green', 'yellow', 'red', 'blue']) {
    assert.equal(refreshedModeMenu.run(`Array.from(tileElements.values()).filter(tile => tile.getAttribute("data-color") === "${color}").length`), color === 'blue' ? 1 : 7);
}
assert.equal(refreshedModeMenu.run('tileElements.get("0,0").getAttribute("data-color")'), 'blue');
assert.equal(refreshedModeMenu.run('availableTiles.length'), 19);
assert.equal(refreshedModeMenu.run('currentLevel'), 1);
assert.equal(refreshedModeMenu.run('tutorialWelcomeDialog.open === true'), false);
console.log('Tutorial empty tile, maple-only planting controls, save/continue, and normal new game passed.');
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
const balance = g.run('moneyInCents');
g.run('upgradeSeed(plantedSeeds[0])');
assert.equal(g.run('moneyInCents'), balance);
g.run('plantSeed("maple"); for (let i = 0; i < 20; i++) upgradeSeed(plantedSeeds[1])');
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
console.log('Maple planting, stage prices/income, purchased growth, mature cap, saving, legacy saves, and affordability passed.');

const birch = game();
birch.elements.get('.plant-birch-button').events.click();
assert.equal(birch.run('plantedSeeds[0].treeType'), 'birch');
assert.equal(birch.run('moneyInCents'), 9999899);
const imageNames = ['seed', 'germination', 'sprout', 'seedling', 'sapling', 'adult', 'adult'];
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
    for (let upgrade = 1; upgrade <= 4; upgrade++) {
        const before = birch.run('moneyInCents');
        birch.run('upgradeSeed(plantedSeeds[0])');
        assert.equal(birch.run('moneyInCents'), before - cost);
        assert.equal(birch.run('plantedSeeds[0].stageIndex'), stage === 5 ? 5 : stage + (upgrade === 4 ? 1 : 0));
    }
}
birch.run('plantSeed("birch"); upgradeSeed(plantedSeeds[1])');
assert.equal(birch.run('plantedSeeds[1].stageIndex'), 0);
assert.equal(birch.run('plantedSeeds[1].upgradesInStage'), 1);
birch.run('gameStarted = true; saveGame()');
const loadedBirch = game(birch.storage.get('tree-planting-game-save'));
loadedBirch.run('continueGame()');
assert.equal(loadedBirch.run('plantedSeeds[1].treeType'), 'birch');
assert.equal(loadedBirch.run('plantedSeeds[1].upgradesInStage'), 1);
loadedBirch.run('for (let i = 0; i < 3; i++) upgradeSeed(plantedSeeds[1])');
assert.equal(loadedBirch.run('plantedSeeds[1].stageIndex'), 1);
birch.run('moneyInCents = 0; updateMoneyDisplay(); plantSeed("birch")');
assert.equal(birch.elements.get('.plant-birch-button').disabled, true);
assert.equal(birch.run('plantedSeeds.length'), 2);
console.log('Birch planting, all stage images/stats, four upgrades per stage, purchased growth, save/load, and affordability passed.');

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
    assert.equal(spruce.run('getSeedUpgradeCost(plantedSeeds[0])'), cost);
    for (let upgrade = 1; upgrade <= 4; upgrade++) {
        const before = spruce.run('moneyInCents');
        spruce.run('upgradeSeed(plantedSeeds[0])');
        assert.equal(spruce.run('moneyInCents'), before - cost);
        assert.equal(spruce.run('plantedSeeds[0].stageIndex'), stage === 5 ? 5 : stage + (upgrade === 4 ? 1 : 0));
    }
}
spruce.run('plantSeed("spruce"); upgradeSeed(plantedSeeds[1]); gameStarted = true; saveGame()');
assert.equal(spruce.run('plantedSeeds[1].upgradesInStage'), 1);
const loadedSpruce = game(spruce.storage.get('tree-planting-game-save'));
loadedSpruce.run('continueGame()');
assert.equal(loadedSpruce.run('plantedSeeds[1].treeType'), 'spruce');
assert.equal(loadedSpruce.run('plantedSeeds[1].upgradesInStage'), 1);
loadedSpruce.run('for (let i = 0; i < 3; i++) upgradeSeed(plantedSeeds[1])');
assert.equal(loadedSpruce.run('plantedSeeds[1].stageIndex'), 1);
spruce.run('moneyInCents = 0; updateMoneyDisplay(); plantSeed("spruce")');
assert.equal(spruce.elements.get('.plant-spruce-button').disabled, true);
assert.equal(spruce.run('plantedSeeds.length'), 2);
console.log('Spruce planting, stage images/stats, four upgrades, purchased growth, save/load, and affordability passed.');

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
    assert.equal(oak.run('getSeedUpgradeCost(plantedSeeds[0])'), cost);
    for (let upgrade = 1; upgrade <= 4; upgrade++) {
        const before = oak.run('moneyInCents');
        oak.run('upgradeSeed(plantedSeeds[0])');
        assert.equal(oak.run('moneyInCents'), before - cost);
        assert.equal(oak.run('plantedSeeds[0].stageIndex'), stage === 5 ? 5 : stage + (upgrade === 4 ? 1 : 0));
    }
}
oak.run('plantSeed("oak"); upgradeSeed(plantedSeeds[1]); gameStarted = true; saveGame()');
assert.equal(oak.run('plantedSeeds[1].upgradesInStage'), 1);
const loadedOak = game(oak.storage.get('tree-planting-game-save'));
loadedOak.run('continueGame()');
assert.equal(loadedOak.run('plantedSeeds[1].treeType'), 'oak');
assert.equal(loadedOak.run('plantedSeeds[1].upgradesInStage'), 1);
loadedOak.run('for (let i = 0; i < 3; i++) upgradeSeed(plantedSeeds[1])');
assert.equal(loadedOak.run('plantedSeeds[1].stageIndex'), 1);
oak.run('moneyInCents = 299; updateMoneyDisplay(); plantSeed("oak")');
assert.equal(oak.elements.get('.plant-oak-button').disabled, true);
assert.equal(oak.run('plantedSeeds.length'), 2);
console.log('Oak planting, stage images/stats, four upgrades, purchased growth, save/load, and affordability passed.');

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
    const cost = migrated.run('getSeedUpgradeCost(plantedSeeds[0])');
    migrated.run('upgradeSeed(plantedSeeds[0])');
    assert.equal(migrated.run('moneyInCents'), before - cost);
    assert.equal(migrated.run('plantedSeeds[0].stageIndex'), 5);
    const updatedSave = JSON.parse(migrated.storage.get('tree-planting-game-save'));
    assert.equal(updatedSave.version, 5);
    assert.equal(updatedSave.seeds[0].stageIndex, 5);
    assert.equal(migrated.run('getSeedUpgradeCost(plantedSeeds[0])'), 0);
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
hover.run('currentLevel = 2; addTileObstacle(0, 0, "rock"); openObstacleDialog("0,0", { clientX: 500, clientY: 500 })');
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
currency.run('currentLevel = 2; addTileObstacle(0, 0, "rock"); openObstacleDialog("0,0")');
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

const levels = game();
assert.equal(levels.run('boardTileCoordinates.length'), 22);
levels.run('startGame()');
assert.equal(levels.elements.get('.next-level-button').hidden, true);
levels.elements.get('.next-level-button').events.click();
assert.equal(levels.run('currentLevel'), 1);
levels.run('plantSeed("birch"); plantSeed("birch"); for (let i = 0; i < 8; i++) upgradeSeed(plantedSeeds[0]); for (let i = 0; i < 7; i++) upgradeSeed(plantedSeeds[1])');
assert.equal(levels.elements.get('.next-level-button').hidden, true);
levels.run('upgradeSeed(plantedSeeds[1])');
assert.equal(levels.elements.get('.next-level-button').hidden, false);
assert.equal(levels.elements.get('.level-progress').value, 100);
levels.run('compostTree(plantedSeeds[0]); compostTree(plantedSeeds[0])');
assert.equal(levels.elements.get('.next-level-button').hidden, false);
const unlocked = game(levels.storage.get('tree-planting-game-save'));
unlocked.run('continueGame()');
assert.equal(unlocked.elements.get('.next-level-button').hidden, false);
levels.run('plantSeed(); openSeedDialog(plantedSeeds[0])');
levels.elements.get('.buy-tile-button').events.click();
assert.equal(levels.run('boardTileCoordinates.length'), 23);
const levelBalance = levels.run('moneyInCents');
levels.elements.get('.next-level-button').events.click();
assert.equal(levels.run('currentLevel'), 2);
assert.equal(levels.run('plantedSeeds.length'), 0);
assert.equal(levels.run('purchasedTileCoordinates.length'), 0);
assert.equal(levels.run('boardTileCoordinates.length'), 7);
assert.equal(levels.run('availableTiles.length'), 6);
assert.equal(levels.run('tileObstacles.size'), 1);
assert.equal(levels.run('moneyInCents'), levelBalance);
assert.equal(levels.elements.get('.seed-dialog').open, false);
assert.equal(levels.elements.get('.level-label').textContent, 'Level 2');
assert.equal(levels.elements.get('.level-progress').value, 0);
assert.equal(levels.elements.get('.next-level-button').hidden, true);
const levelTwo = game(levels.storage.get('tree-planting-game-save'));
levelTwo.run('continueGame()');
assert.equal(levelTwo.elements.get('.level-label').textContent, 'Level 2');
assert.equal(levelTwo.run('plantedSeeds.length'), 0);
levelTwo.run('for (let i = 0; i < 5; i++) plantSeed()');
assert.equal(levelTwo.elements.get('.next-level-button').hidden, true);

const incomeLevel = game();
incomeLevel.run('startGame(); for (let i = 0; i < 4; i++) plantSeed()');
assert.equal(incomeLevel.elements.get('.next-level-button').hidden, true);
incomeLevel.run('plantSeed()');
assert.equal(incomeLevel.elements.get('.next-level-button').hidden, false);
const upgradedGrowthLevel = game();
upgradedGrowthLevel.run('startGame(); plantSeed("birch"); plantSeed("birch"); for (const seed of plantedSeeds) { for (let i = 0; i < 8; i++) upgradeSeed(seed); }');
assert.equal(upgradedGrowthLevel.elements.get('.next-level-button').hidden, false);
const legacyLevelSave = JSON.parse(incomeLevel.storage.get('tree-planting-game-save'));
delete legacyLevelSave.currentLevel;
delete legacyLevelSave.levelOneCompleted;
const legacyLevel = game(JSON.stringify(legacyLevelSave));
legacyLevel.run('continueGame()');
assert.equal(legacyLevel.run('currentLevel'), 1);
assert.equal(legacyLevel.elements.get('.next-level-button').hidden, false);
console.log('Level thresholds, purchased growth, persistent unlock, board reset, level 2 persistence, and legacy saves passed.');

const obstacleFree = game();
obstacleFree.run('startGame(); Math.random = () => 0; spawnRandomTileObstacles()');
assert.equal(obstacleFree.run('tileObstacles.size'), 0);
assert.equal(obstacleFree.run('availableTiles.length'), 22);
obstacleFree.elements.get('.buy-tile-button').events.click();
assert.equal(obstacleFree.run('tileObstacles.size'), 0);
assert.equal(obstacleFree.run('availableTiles.length'), 23);
const obstructedSave = JSON.parse(obstacleFree.storage.get('tree-planting-game-save'));
obstructedSave.obstacles = [{ q: 0, r: 0, type: 'rock' }];
const clearedSave = game(JSON.stringify(obstructedSave));
clearedSave.run('continueGame()');
assert.equal(clearedSave.run('tileObstacles.size'), 0);
assert.equal(clearedSave.run('availableTiles.length'), 23);
assert.equal(JSON.parse(clearedSave.storage.get('tree-planting-game-save')).obstacles.length, 0);
obstacleFree.run('levelOneCompleted = true; advanceToNextLevel()');
assert.equal(obstacleFree.run('currentLevel'), 2);
assert.equal(obstacleFree.run('tileObstacles.size'), 1);
console.log('Level 1 obstacles disabled for starting, purchased, and saved tiles; level 2 obstacles retained.');

const levelTwoObstacleSave = obstacleFree.storage.get('tree-planting-game-save');
const loadedObstacle = game(levelTwoObstacleSave);
loadedObstacle.run('continueGame()');
assert.equal(loadedObstacle.run('boardTileCoordinates.length'), 7);
assert.equal(loadedObstacle.run('tileObstacles.size'), 1);
assert.equal(JSON.stringify(loadedObstacle.run('Array.from(tileObstacles.keys())')),
    JSON.stringify(obstacleFree.run('Array.from(tileObstacles.keys())')));
loadedObstacle.elements.get('.buy-tile-button').events.click();
assert.equal(loadedObstacle.run('tileObstacles.size'), 1);
loadedObstacle.run('const obstacle = Array.from(tileObstacles.values())[0]; clearTileObstacle(obstacle.q, obstacle.r)');
const clearedLevelTwo = game(loadedObstacle.storage.get('tree-planting-game-save'));
clearedLevelTwo.run('continueGame()');
assert.equal(clearedLevelTwo.run('tileObstacles.size'), 0);
console.log('Level 2 starts with seven tiles and one obstacle, preserves its location, and saves obstacle removal.');

const seedlingsLevel = game();
seedlingsLevel.run('startGame(); levelOneCompleted = true; advanceToNextLevel(); for (let i = 0; i < 3; i++) plantSeed("birch"); for (const seed of plantedSeeds) { for (let i = 0; i < 8; i++) upgradeSeed(seed); }');
assert.equal(seedlingsLevel.elements.get('.next-level-button').hidden, true);
assert.equal(seedlingsLevel.elements.get('.level-progress').value, 0);
seedlingsLevel.elements.get('.next-level-button').events.click();
assert.equal(seedlingsLevel.run('currentLevel'), 2);
seedlingsLevel.run('for (let i = 0; i < 4; i++) upgradeSeed(plantedSeeds[0]); for (let i = 0; i < 4; i++) upgradeSeed(plantedSeeds[1])');
assert.equal(seedlingsLevel.elements.get('.next-level-button').hidden, true);
assert.ok(Math.abs(seedlingsLevel.elements.get('.level-progress').value - 200 / 3) < 1e-10);
seedlingsLevel.run('for (let i = 0; i < 4; i++) upgradeSeed(plantedSeeds[2])');
assert.equal(seedlingsLevel.elements.get('.next-level-button').hidden, false);
assert.equal(seedlingsLevel.elements.get('.level-progress').value, 100);
const loadedSeedlings = game(seedlingsLevel.storage.get('tree-planting-game-save'));
loadedSeedlings.run('continueGame()');
assert.equal(loadedSeedlings.elements.get('.next-level-button').hidden, false);
loadedSeedlings.elements.get('.next-level-button').events.click();
assert.equal(loadedSeedlings.run('currentLevel'), 3);
assert.equal(loadedSeedlings.run('plantedSeeds.length'), 0);
assert.equal(loadedSeedlings.elements.get('.level-label').textContent, 'Level 3');
assert.equal(loadedSeedlings.elements.get('.next-level-button').hidden, true);
const levelThree = game(loadedSeedlings.storage.get('tree-planting-game-save'));
levelThree.run('continueGame()');
assert.equal(levelThree.run('currentLevel'), 3);
const upgradedSeedlings = game();
upgradedSeedlings.run('startGame(); levelOneCompleted = true; advanceToNextLevel(); for (let i = 0; i < 3; i++) plantSeed("birch"); for (const seed of plantedSeeds) { for (let i = 0; i < 12; i++) upgradeSeed(seed); }');
assert.equal(upgradedSeedlings.elements.get('.next-level-button').hidden, false);
console.log('Level 2 requires three seedlings, tracks progress, unlocks with purchased growth, and advances and saves level 3.');

// Play through every level in order; changes below exercise the real event paths.
const campaign = game();
campaign.run('startGame(); Math.random = () => 0.99');
function expectIncomplete(level) {
    assert.equal(campaign.run('currentLevel'), level);
    assert.equal(campaign.elements.get('.next-level-button').hidden, true);
    assert.equal(campaign.elements.get('.level-notification').hidden, true);
    campaign.elements.get('.next-level-button').events.click();
    assert.equal(campaign.run('currentLevel'), level);
}
function completeAndAdvance(level) {
    assert.equal(campaign.run('currentLevel'), level);
    assert.equal(campaign.elements.get('.level-progress').value, 100);
    assert.match(campaign.elements.get('.level-notification').textContent, /Level Complete/);
    assert.equal(campaign.elements.get('.level-notification').hidden, false);
    const resumed = game(campaign.storage.get('tree-planting-game-save'));
    resumed.run('continueGame()');
    assert.equal(resumed.run('currentLevel'), level);
    assert.match(resumed.elements.get('.level-notification').textContent, /Level Complete/);
    assert.equal(resumed.elements.get('.next-level-button').hidden, level === 8);
    campaign.elements.get('.next-level-button').events.click();
    assert.equal(campaign.run('currentLevel'), Math.min(level + 1, 8));
    if (level < 8) {
        assert.equal(campaign.run('plantedSeeds.length'), 0);
        assert.equal(campaign.elements.get('.level-notification').hidden, true);
    }
}
expectIncomplete(1);
campaign.run('for (let i = 0; i < 5; i++) plantSeed()');
completeAndAdvance(1);
campaign.run('for (let i = 0; i < 3; i++) plantSeed("birch"); for (const seed of plantedSeeds) { for (let i = 0; i < 12; i++) upgradeSeed(seed); }');
completeAndAdvance(2);
assert.match(campaign.elements.get('.level-objective').textContent, /Forest Expansion/);
assert.equal(campaign.run('boardTileCoordinates.length'), 12);
assert.equal(campaign.run('boardLayoutVersion'), 1);
assert.equal(JSON.stringify(campaign.run('boardTileCoordinates')),
    JSON.stringify(campaign.run('getStartingCoordinates(12, 1)')));
campaign.run('for (let i = 0; i < 7; i++) plantSeed()');
expectIncomplete(3);
assert.equal(campaign.elements.get('.level-progress-text').textContent, '7/8 living trees');
campaign.run('compostTree(plantedSeeds[0])');
assert.equal(campaign.elements.get('.level-progress-text').textContent, '6/8 living trees');
campaign.run('plantSeed(); plantSeed()');
completeAndAdvance(3);
assert.match(campaign.elements.get('.level-objective').textContent, /Stronger Roots/);
assert.equal(campaign.run('boardTileCoordinates.length'), 15);
assert.equal(campaign.run('boardLayoutVersion'), 1);
assert.equal(JSON.stringify(campaign.run('boardTileCoordinates')),
    JSON.stringify(campaign.run('getStartingCoordinates(15, 1)')));
campaign.run('for (let i = 0; i < 3; i++) plantSeed(); for (let j = 0; j < 3; j++) { for (let i = 0; i < (j === 2 ? 15 : 16); i++) upgradeSeed(plantedSeeds[j]); }');
expectIncomplete(4);
campaign.run('upgradeSeed(plantedSeeds[2])');
completeAndAdvance(4);
assert.match(campaign.elements.get('.level-objective').textContent, /Profitable Forest/);
for (let i = 0; i < 6; i++) campaign.elements.get('.buy-tile-button').events.click();
campaign.run('for (let i = 0; i < 24; i++) plantSeed()');
expectIncomplete(5);
assert.equal(campaign.elements.get('.level-progress-text').textContent, '9.60/10 leaves per payout');
campaign.run('compostTree(plantedSeeds[0])');
assert.equal(campaign.elements.get('.level-progress-text').textContent, '9.20/10 leaves per payout');
campaign.run('plantSeed(); plantSeed()');
completeAndAdvance(5);
assert.match(campaign.elements.get('.level-objective').textContent, /Established Woodland/);
campaign.run('for (let i = 0; i < 5; i++) plantSeed(); for (let j = 0; j < 5; j++) { for (let i = 0; i < (j === 4 ? 19 : 24); i++) upgradeSeed(plantedSeeds[j]); }');
expectIncomplete(6);
assert.equal(campaign.elements.get('.level-progress-text').textContent, '4/5 mature trees or higher');
campaign.run('upgradeSeed(plantedSeeds[4])');
completeAndAdvance(6);
assert.match(campaign.elements.get('.level-objective').textContent, /Forest Diversity/);
assert.equal(campaign.run('boardTileCoordinates.length'), 27);
assert.equal(campaign.run('boardLayoutVersion'), 1);
assert.equal(JSON.stringify(campaign.run('boardTileCoordinates')),
    JSON.stringify(campaign.run('getStartingCoordinates(27, 1)')));
campaign.run('plantSeed("maple"); plantSeed("maple"); plantSeed("birch"); plantSeed("birch"); plantSeed("spruce"); plantSeed("oak")');
expectIncomplete(7);
assert.equal(campaign.elements.get('.level-progress-text').textContent, '2/3 species with 2+ trees');
campaign.run('compostTree(plantedSeeds[0])');
assert.equal(campaign.elements.get('.level-progress-text').textContent, '1/3 species with 2+ trees');
campaign.run('plantSeed("maple"); plantSeed("spruce")');
completeAndAdvance(7);
assert.match(campaign.elements.get('.level-objective').textContent, /Forest Renewal/);
assert.equal(campaign.run('matureTreesComposted'), 0);
campaign.run('plantSeed(); compostTree(plantedSeeds[0])');
assert.equal(campaign.run('matureTreesComposted'), 0);
campaign.run('plantSeed(); plantSeed(); for (const seed of plantedSeeds) { for (let i = 0; i < 20; i++) upgradeSeed(seed); }');
expectIncomplete(8);
assert.equal(campaign.elements.get('.level-progress-text').textContent, '0/2 mature trees composted');
const firstCompostedTree = campaign.run('plantedSeeds[0]');
campaign.run('compostTree(plantedSeeds[0])');
assert.equal(campaign.elements.get('.level-progress-text').textContent, '1/2 mature trees composted');
assert.equal(campaign.elements.get('.level-progress').value, 50);
firstCompostedTree.image.events.contextmenu({ preventDefault() {}, stopPropagation() {} });
assert.equal(campaign.run('matureTreesComposted'), 1);
const partialCompost = game(campaign.storage.get('tree-planting-game-save'));
partialCompost.run('continueGame()');
assert.equal(partialCompost.run('matureTreesComposted'), 1);
assert.equal(partialCompost.elements.get('.level-progress').value, 50);
campaign.run('compostTree(plantedSeeds[0])');
completeAndAdvance(8);
assert.equal(campaign.run('plantedSeeds.length'), 0);
assert.match(campaign.elements.get('.level-notification').textContent, /All 8 levels completed/);
assert.equal(campaign.elements.get('.level-progress-text').textContent, '2/2 mature trees composted');

for (const version of [1, 2, 3]) {
    const oldGrowthSave = JSON.parse(saved);
    oldGrowthSave.version = version;
    oldGrowthSave.seeds = [{ ...oldGrowthSave.seeds[0], stageIndex: version === 2 ? 5 : 6, upgradesInStage: 2 }];
    const capped = game(JSON.stringify(oldGrowthSave));
    capped.run('continueGame(); openSeedDialog(plantedSeeds[0])');
    assert.equal(capped.run('plantedSeeds[0].stageIndex'), 5);
    assert.equal(capped.run('plantedSeeds[0].upgradesInStage'), 0);
    assert.equal(capped.elements.get('.seed-upgrade-cost').textContent, 'Grown');
    const before = capped.run('moneyInCents');
    capped.run('upgradeSeed(plantedSeeds[0])');
    assert.equal(capped.run('plantedSeeds[0].stageIndex'), 5);
    assert.equal(capped.run('moneyInCents'), before);
    assert.equal(capped.run('matureTreesComposted'), 0);
}
const earlyCompost = game();
earlyCompost.run('startGame(); plantSeed(); for (let i = 0; i < 20; i++) upgradeSeed(plantedSeeds[0]); compostTree(plantedSeeds[0])');
assert.equal(earlyCompost.run('matureTreesComposted'), 0);
console.log('All eight sequential objectives, compost thresholds, partial save/load, duplicate protection, and retired-stage migration passed.');

for (const [index, count] of [22, 7, 12, 15, 19, 19, 27, 36].entries()) {
    const board = game();
    board.run(`currentLevel = ${index + 1}; startingTileCount = levelTileCounts[currentLevel - 1]; resetBoard(); startGame()`);
    assert.equal(board.run('boardTileCoordinates.length'), count);
    assert.equal(board.run('boardTileKeys.size'), count);
    assert.equal(board.run('availableTiles.length'), count);
    assert.equal(board.run(`boardTileCoordinates.every(({ q, r }) =>
        (q === 0 && r === 0) || tileNeighborOffsets.some(([dq, dr]) =>
            boardTileKeys.has(getTileKey(q + dq, r + dr))))`), true);
    board.run('plantSeed()');
    board.elements.get('.buy-tile-button').events.click();
    const restoredBoard = game(board.storage.get('tree-planting-game-save'));
    restoredBoard.run('continueGame()');
    assert.equal(restoredBoard.run('boardTileCoordinates.length'), count + 1);
    assert.equal(restoredBoard.run('plantedSeeds.length'), 1);
    assert.equal(restoredBoard.run('purchasedTileCoordinates.length'), 1);
}
const oldLargeBoard = game();
oldLargeBoard.run('currentLevel = 3; startingTileCount = 91; resetBoard(); startGame(); plantSeed()');
const oldBoardSave = JSON.parse(oldLargeBoard.storage.get('tree-planting-game-save'));
delete oldBoardSave.boardTileCount;
oldBoardSave.boardSideLength = 6;
const oldBoardRestored = game(JSON.stringify(oldBoardSave));
oldBoardRestored.run('continueGame()');
assert.equal(oldBoardRestored.run('boardTileCoordinates.length'), 91);
assert.equal(oldBoardRestored.run('plantedSeeds.length'), 1);
console.log('Exact level tile counts, connected layouts, purchased-tile save/load, and legacy board preservation passed.');

for (const count of [7, 12, 15, 19, 27, 36]) {
    const layout = game();
    const coordinates = layout.run(`getStartingCoordinates(${count})`);
    const center = coordinates.reduce((sum, { q, r }) => ({
        x: sum.x + Math.sqrt(3) * (q + r / 2), y: sum.y + 1.5 * r,
    }), { x: 0, y: 0 });
    assert.ok(Math.hypot(center.x / count, center.y / count) < 0.2,
        `${count}-tile board should stay centered within a fifth of a tile radius`);
}
const previousLayout = game();
previousLayout.run('currentLevel = 4; startingTileCount = 15; boardLayoutVersion = 1; resetBoard(); startGame(); plantSeed()');
const previousLayoutSave = JSON.parse(previousLayout.storage.get('tree-planting-game-save'));
delete previousLayoutSave.boardLayoutVersion;
const restoredLayout = game(JSON.stringify(previousLayoutSave));
restoredLayout.run('continueGame()');
assert.equal(restoredLayout.run('boardTileCoordinates.length'), 15);
assert.equal(restoredLayout.run('plantedSeeds.length'), 1);
assert.equal(JSON.stringify(restoredLayout.run('boardTileCoordinates')),
    JSON.stringify(previousLayout.run('boardTileCoordinates')));
console.log('Partial rings remain centered and old layouts load without moving trees.');

const pressFeedback = game();
pressFeedback.elements.get('.plant-maple-button').events.click();
for (let stage = 0; stage <= pressFeedback.run('maximumGrowthStage'); stage += 1) {
    pressFeedback.run(`plantedSeeds[0].stageIndex = ${stage}; updateSeedAppearance(plantedSeeds[0])`);
    const tree = pressFeedback.run('plantedSeeds[0].image');
    tree.events.pointerdown({ button: 0, pointerId: 1 });
    const overlay = pressFeedback.run('tilePressOverlay');
    assert.equal(overlay.getAttribute('class'), 'tile-press-overlay');
    assert.equal(overlay.getAttribute('points'), pressFeedback.run('pressedTreeTile.getAttribute("data-points")'));
    assert.equal(tree.capturedPointer, 1);
    tree.events.lostpointercapture();
    assert.equal(overlay.removed, true);
    assert.equal(pressFeedback.run('tilePressOverlay'), null);
}
const emptyTile = pressFeedback.run('tileElements.get(getTileKey(availableTiles[0].q, availableTiles[0].r))');
emptyTile.events.pointerdown({ button: 0, pointerId: 2 });
assert.ok(pressFeedback.run('tilePressOverlay'));
pressFeedback.run('releasePressedTreeTile()');
assert.equal(pressFeedback.run('tilePressOverlay'), null);
emptyTile.events.pointerdown({ button: 2, pointerId: 3 });
assert.equal(pressFeedback.run('tilePressOverlay'), null);
console.log('Tile press feedback covers every tree stage and empty tiles, clears on release, and ignores right-clicks.');

const tileInteraction = game();
tileInteraction.elements.get('.plant-maple-button').events.click();
const plantedTile = tileInteraction.run('tileElements.get(getTileKey(plantedSeeds[0].tile.q, plantedSeeds[0].tile.r))');
plantedTile.events.mouseenter({ clientX: 450, clientY: 450 });
assert.equal(tileInteraction.run('selectedSeed === plantedSeeds[0]'), true);
assert.equal(tileInteraction.run('seedDialog.open'), true);
const balanceBeforeTileClick = tileInteraction.run('moneyInCents');
const tileUpgradeCost = tileInteraction.run('getSeedUpgradeCost(plantedSeeds[0])');
plantedTile.events.click();
assert.equal(tileInteraction.run('plantedSeeds[0].upgradesInStage'), 1);
assert.equal(tileInteraction.run('moneyInCents'), balanceBeforeTileClick - tileUpgradeCost);
plantedTile.events.mouseleave();
assert.equal(tileInteraction.run('selectedSeed'), null);
tileInteraction.run('compostTree(plantedSeeds[0])');
const balanceAfterCompost = tileInteraction.run('moneyInCents');
plantedTile.events.mouseenter({ clientX: 450, clientY: 450 });
plantedTile.events.click();
assert.equal(tileInteraction.run('selectedSeed'), null);
assert.equal(tileInteraction.run('moneyInCents'), balanceAfterCompost);
console.log('Whole planted tiles show hover details and purchase one upgrade; cleared tiles no longer act on removed trees.');

const payouts = game();
const payoutButton = payouts.elements.get('.done-button');
const initialBalance = payouts.run('moneyInCents');
payoutButton.events.click();
assert.equal(payouts.run('moneyInCents'), initialBalance);
payouts.run('startGame()');
assert.equal(payoutButton.disabled, true);
payoutButton.events.click();
assert.equal(payouts.run('moneyInCents'), initialBalance);
payouts.run('plantSeed("maple"); plantSeed("birch")');
assert.equal(payoutButton.disabled, false);
const beforePayout = payouts.run('moneyInCents');
payoutButton.events.click();
assert.equal(payouts.run('moneyInCents'), beforePayout + 70);
assert.equal(payouts.run('plantedSeeds[0].upgradesInStage'), 0);
payoutButton.events.click();
assert.equal(payouts.run('moneyInCents'), beforePayout + 140);
const payoutSave = JSON.parse(payouts.storage.get('tree-planting-game-save'));
assert.equal(payoutSave.moneyInCents, beforePayout + 140);
assert.equal(payoutSave.elapsedCycleTime, undefined);
assert.equal(payoutSave.clockSpeed, undefined);
assert.equal(payoutSave.seeds[0].nextFreeUpgradeAtCycleTime, undefined);
// Old timing fields are ignored and stripped on the next save.
payoutSave.version = 4;
payoutSave.elapsedCycleTime = 500000;
payoutSave.clockSpeed = 3;
payoutSave.seeds.forEach(seed => { seed.nextFreeUpgradeAtCycleTime = 1; });
const legacyPayout = game(JSON.stringify(payoutSave));
legacyPayout.run('continueGame()');
assert.equal(legacyPayout.run('moneyInCents'), payoutSave.moneyInCents);
assert.equal(legacyPayout.run('plantedSeeds[0].upgradesInStage'), 0);
legacyPayout.elements.get('.done-button').events.click();
assert.equal(legacyPayout.run('moneyInCents'), payoutSave.moneyInCents + 70);
payouts.run('for (let i = 0; i < 4; i++) upgradeSeed(plantedSeeds[0])');
const upgradedBalance = payouts.run('moneyInCents');
payoutButton.events.click();
assert.equal(payouts.run('moneyInCents'), upgradedBalance + 90);
payouts.run('while (plantedSeeds.length) compostTree(plantedSeeds[0])');
assert.equal(payoutButton.disabled, true);
console.log('Done pays current tree income once per click, saves earnings, respects game start, and migrates timed saves without passive growth.');

for (const color of ['red', 'green', 'yellow']) {
    const colored = game();
    colored.elements.get('.new-game-button').events.click();
    assert.equal(colored.elements.get('.color-dialog').open, true);
    assert.equal(colored.run('gameStarted'), false);
    colored.elements.get(`.choose-${color}`).events.click();
    colored.elements.get('.choose-seed-maple').events.click();
    colored.elements.get('.setup-done-button').events.click();
    assert.equal(colored.run('selectedColor'), color);
    assert.equal(colored.run('gameStarted'), true);
    colored.run('for (let i = 0; i < 7; i++) plantSeed()');
    assert.equal(colored.run('plantedSeeds.length'), 9);
    assert.equal(colored.run('plantedSeeds.filter(seed => seed.stageIndex === 0).every(seed => getBoardTileColor(seed.tile.q, seed.tile.r) === selectedColor)'), true);
    assert.equal(colored.run('availableTiles.length'), 13);
    assert.equal(colored.elements.get('.plant-maple-button').disabled, true);
    assert.equal(colored.elements.get('.plant-oak-button').disabled, true);
    const balance = colored.run('moneyInCents');
    colored.run('plantSeed()');
    assert.equal(colored.run('moneyInCents'), balance);
    const resumed = game(colored.storage.get('tree-planting-game-save'));
    resumed.run('continueGame()');
    assert.equal(resumed.run('selectedColor'), color);
    assert.equal(resumed.run('getPlantableTiles().length'), 0);
    resumed.run('compostTree(plantedSeeds[0])');
    assert.equal(resumed.run('getPlantableTiles().length'), 1);
    resumed.run('plantSeed()');
    assert.equal(resumed.run('plantedSeeds.length'), 9);
    resumed.elements.get('.buy-tile-button').events.click();
    assert.equal(resumed.run('getPlantableTiles().length'), resumed.run('(tileObstacles.has(getTileKey(purchasedTileCoordinates[0].q, purchasedTileCoordinates[0].r)) || plantedSeeds.some(seed => seed.tile.q === purchasedTileCoordinates[0].q && seed.tile.r === purchasedTileCoordinates[0].r)) ? 0 : 1'));
    resumed.run('plantSeed()');
    assert.equal(resumed.run('plantedSeeds.filter(seed => seed.stageIndex === 0).every(seed => getBoardTileColor(seed.tile.q, seed.tile.r) === selectedColor)'), true);
}
console.log('All color choices restrict every seed type, persist on reload, block full regions, and support composting and expansion.');
const unchosen = game();
unchosen.run('selectedColor = null; updateMoneyDisplay(); plantSeed()');
assert.equal(unchosen.run('plantedSeeds.length'), 0);
assert.equal(unchosen.elements.get('.plant-maple-button').disabled, true);
const oldColorSave = JSON.parse(refreshedModeMenu.storage.get('tree-planting-game-save'));
delete oldColorSave.selectedColor;
delete oldColorSave.humanColor;
delete oldColorSave.activeBoardColors;
delete oldColorSave.playerStates;
const oldColorGame = game(JSON.stringify(oldColorSave));
oldColorGame.run('continueGame()');
assert.equal(oldColorGame.elements.get('.color-dialog').open, true);
assert.equal(oldColorGame.run('gameStarted'), false);
oldColorGame.elements.get('.choose-red').events.click();
oldColorGame.elements.get('.choose-seed-maple').events.click();
oldColorGame.elements.get('.setup-done-button').events.click();
assert.equal(oldColorGame.run('gameStarted'), true);
assert.equal(oldColorGame.run('selectedColor'), 'red');
assert.equal(JSON.parse(oldColorGame.storage.get('tree-planting-game-save')).selectedColor, 'red');
console.log('Unselected boards prevent planting and existing normal saves request and persist a color.');

const freePlay = game();
freePlay.elements.get('.new-game-button').events.click();
freePlay.elements.get('.choose-yellow').events.click();
freePlay.elements.get('.choose-seed-maple').events.click();
freePlay.elements.get('.setup-done-button').events.click();
freePlay.run('for (let i = 0; i < 7; i++) plantSeed()');
assert.equal(freePlay.elements.get('.level-row').hidden, true);
assert.equal(freePlay.elements.get('.level-details').hidden, true);
assert.equal(freePlay.elements.get('.next-level-button').hidden, true);
assert.equal(freePlay.elements.get('.level-notification').hidden, true);
assert.equal(freePlay.run('completedLevels.size'), 0);
freePlay.elements.get('.next-level-button').events.click();
assert.equal(freePlay.run('plantedSeeds.length'), 9);
assert.equal(freePlay.run('boardTileCoordinates.length'), 22);
const freePlayResume = game(freePlay.storage.get('tree-planting-game-save'));
freePlayResume.run('continueGame()');
assert.equal(freePlayResume.run('normalMode'), true);
assert.equal(freePlayResume.elements.get('.level-row').hidden, true);
const freeBalance = freePlayResume.run('moneyInCents');
const freeIncome = freePlayResume.run('getCurrentPlayerIncome()');
freePlayResume.elements.get('.done-button').events.click();
assert.equal(freePlayResume.run('playerStates.find(player => player.color === "yellow").moneyInCents'), freeBalance + freeIncome);
assert.equal(freePlayResume.run('selectedColor'), 'red');
console.log('Normal mode hides and disables levels, retains its board, saves mode, and continues payouts.');

for (const count of [1, 2, 3]) {
    for (const color of ['red', 'green', 'yellow']) {
        const setup = game();
        setup.elements.get('.new-game-button').events.click();
        const slider = setup.elements.get('.player-count-slider');
        slider.value = String(count);
        slider.events.input();
        assert.equal(setup.elements.get('.player-count-output').textContent, `${count} ${count === 1 ? 'player' : 'players'}`);
        setup.elements.get(`.choose-${color}`).events.click();
        setup.elements.get('.choose-seed-maple').events.click();
        setup.elements.get('.setup-done-button').events.click();
        assert.equal(setup.run('boardTileCoordinates.length'), 1 + count * 7);
        assert.equal(setup.run('boardTileKeys.size'), 1 + count * 7);
        assert.equal(setup.run('activeBoardColors.length'), count);
        assert.equal(setup.run('activeBoardColors.includes(selectedColor)'), true);
        assert.equal(setup.run('getPlantableTiles().length'), 6);
        assert.equal(setup.run('plantedSeeds.length'), count);
        assert.equal(setup.run('plantedSeeds.every(seed => seed.stageIndex === 2 && seed.upgradesInStage === 0)'), true);
        for (const region of setup.run('activeBoardColors')) {
            assert.equal(setup.run(`plantedSeeds.filter(seed => getBoardTileColor(seed.tile.q, seed.tile.r) === "${region}").length`), 1);
            assert.equal(setup.run(`(() => {
                const sprout = plantedSeeds.find(seed => getBoardTileColor(seed.tile.q, seed.tile.r) === "${region}");
                const distance = (x, y) => (x - centerX) ** 2 + (y - centerY) ** 2;
                return boardTileCoordinates.filter(tile => getBoardTileColor(tile.q, tile.r) === "${region}").every(tile => {
                    const position = getTileCenter(tile.q, tile.r);
                    return distance(position.x, position.y) <= distance(sprout.x, sprout.y) + 0.001;
                });
            })()`), true);
        }
        for (const region of setup.run('activeBoardColors')) {
            assert.equal(setup.run(`Array.from(tileElements.values()).filter(tile => tile.getAttribute("data-color") === "${region}").length`), 7);
        }
        assert.equal(setup.run('tileElements.get("0,0").getAttribute("data-color")'), 'blue');
        setup.run('plantSeed()');
        setup.elements.get('.buy-tile-button').events.click();
        const resumed = game(setup.storage.get('tree-planting-game-save'));
        resumed.run('continueGame()');
        assert.equal(resumed.run('gameStarted'), true);
        assert.equal(resumed.run('boardTileCoordinates.length'), 2 + count * 7);
        assert.equal(resumed.run('playerCount'), count);
        assert.equal(resumed.run('selectedColor'), color);
        assert.equal(resumed.run('plantedSeeds.length'), setup.run('plantedSeeds.length'));
        assert.equal(JSON.stringify(resumed.run('boardTileCoordinates')), JSON.stringify(setup.run('boardTileCoordinates')));
    }
}
console.log('Player slider builds and saves all nine player-count/color combinations, with one blue center and seven tiles per active color.');

const refreshWithoutSave = game();
assert.notEqual(refreshWithoutSave.elements.get('.save-slot-dialog').open, true);
assert.equal(refreshWithoutSave.elements.get('.game-menu-panel').hidden, false);
const refreshWithSave = game(freePlay.storage.get('tree-planting-game-save'));
assert.notEqual(refreshWithSave.elements.get('.save-slot-dialog').open, true);
assert.equal(refreshWithSave.run('gameStarted'), true);
assert.equal(refreshWithSave.run('plantedSeeds.length'), 9);
assert.equal(refreshWithSave.run('selectedColor'), 'yellow');
console.log('Refresh resumes saved games without a save-slot popup and opens the mode menu for new players.');

const levelModeMenu = game();
levelModeMenu.elements.get('.menu-level-button').events.click();
assert.equal(levelModeMenu.elements.get('.game-menu-panel').hidden, true);
assert.equal(levelModeMenu.run('normalMode'), false);
assert.equal(levelModeMenu.run('gameStarted'), true);
assert.equal(levelModeMenu.run('startingTileCount'), 7);
assert.equal(levelModeMenu.run('selectedColor'), null);
assert.equal(levelModeMenu.run('activeBoardColors'), null);
assert.equal(levelModeMenu.elements.get('.level-row').hidden, false);
assert.equal(levelModeMenu.elements.get('.level-details').hidden, false);
assert.notEqual(levelModeMenu.elements.get('.color-dialog').open, true);
assert.notEqual(levelModeMenu.elements.get('.tutorial-welcome-dialog').open, true);
levelModeMenu.run('for (let i = 0; i < 5; i++) plantSeed()');
assert.equal(levelModeMenu.elements.get('.next-level-button').hidden, false);
levelModeMenu.elements.get('.next-level-button').events.click();
assert.equal(levelModeMenu.run('currentLevel'), 2);
const resumedLevelMode = game(levelModeMenu.storage.get('tree-planting-game-save'));
assert.equal(resumedLevelMode.run('normalMode'), false);
assert.equal(resumedLevelMode.run('currentLevel'), 2);
assert.equal(resumedLevelMode.elements.get('.level-row').hidden, false);
console.log('Level Mode menu starts a seven-tile campaign, enables objectives and advancement, and resumes after refresh.');

for (const seedType of ['maple', 'birch', 'spruce', 'oak']) {
    const seedSetup = game();
    seedSetup.elements.get('.menu-normal-button').events.click();
    seedSetup.elements.get('.choose-red').events.click();
    assert.equal(seedSetup.elements.get('.color-dialog').open, true);
    assert.equal(seedSetup.run('gameStarted'), false);
    seedSetup.elements.get(`.choose-seed-${seedType}`).events.click();
    seedSetup.elements.get('.setup-done-button').events.click();
    assert.equal(seedSetup.run('gameStarted'), true);
    assert.equal(seedSetup.run('selectedSeedType'), seedType);
    assert.equal(seedSetup.run('plantedSeeds.length'), 3);
    assert.equal(seedSetup.run('plantedSeeds.every(seed => seed.stageIndex === 2 && (getBoardTileColor(seed.tile.q, seed.tile.r) !== selectedColor || seed.treeType === selectedSeedType))'), true);
    for (const type of ['maple', 'birch', 'spruce', 'oak']) {
        const button = seedSetup.elements.get(`.plant-${type}-button`);
        assert.equal(button.hidden, type !== seedType);
        const beforeCount = seedSetup.run('plantedSeeds.length');
        const beforeBalance = seedSetup.run('moneyInCents');
        button.events.click();
        assert.equal(seedSetup.run('plantedSeeds.length'), beforeCount + (type === seedType ? 1 : 0));
        if (type !== seedType) assert.equal(seedSetup.run('moneyInCents'), beforeBalance);
    }
    assert.equal(seedSetup.run('plantedSeeds.filter(seed => getBoardTileColor(seed.tile.q, seed.tile.r) === selectedColor).every(seed => seed.treeType === selectedSeedType)'), true);
    const seedResume = game(seedSetup.storage.get('tree-planting-game-save'));
    assert.equal(seedResume.run('selectedSeedType'), seedType);
    assert.equal(seedResume.elements.get(`.plant-${seedType}-button`).hidden, false);
    assert.notEqual(seedResume.elements.get('.color-dialog').open, true);
    seedResume.run('plantSeed()');
    assert.equal(seedResume.run('plantedSeeds.length'), 5);
    assert.equal(seedResume.run('plantedSeeds.filter(seed => getBoardTileColor(seed.tile.q, seed.tile.r) === selectedColor).every(seed => seed.treeType === selectedSeedType)'), true);
    const legacySeedSave = JSON.parse(seedSetup.storage.get('tree-planting-game-save'));
    delete legacySeedSave.selectedSeedType;
    delete legacySeedSave.playerStates;
    const legacySeedGame = game(JSON.stringify(legacySeedSave));
    assert.equal(legacySeedGame.elements.get('.color-dialog').open, true);
    legacySeedGame.elements.get(`.choose-seed-${seedType}`).events.click();
    legacySeedGame.elements.get('.setup-done-button').events.click();
    assert.equal(legacySeedGame.run('plantedSeeds.length'), 4);
    assert.equal(legacySeedGame.run('selectedSeedType'), seedType);
}
console.log('All four seed choices follow color selection, hide other buttons, block other species, persist, and support older saves.');

const combinedSetup = game();
combinedSetup.elements.get('.menu-normal-button').events.click();
const setupDone = combinedSetup.elements.get('.setup-done-button');
assert.equal(setupDone.disabled, true);
setupDone.events.click();
assert.equal(combinedSetup.run('gameStarted'), false);
combinedSetup.elements.get('.choose-yellow').events.click();
assert.equal(combinedSetup.elements.get('.setup-preview').getAttribute('data-color'), 'yellow');
assert.equal(combinedSetup.elements.get('.setup-preview-seed').hidden, true);
assert.equal(combinedSetup.elements.get('.color-dialog').open, true);
assert.equal(setupDone.disabled, true);
combinedSetup.elements.get('.choose-seed-oak').events.click();
assert.equal(combinedSetup.elements.get('.setup-preview-seed').src, 'images/oak/seed.png');
assert.equal(combinedSetup.elements.get('.setup-preview-seed').hidden, false);
assert.equal(setupDone.disabled, false);
assert.equal(combinedSetup.run('gameStarted'), false);
combinedSetup.elements.get('.choose-red').events.click();
assert.equal(combinedSetup.elements.get('.setup-preview').getAttribute('data-color'), 'red');
assert.equal(combinedSetup.elements.get('.setup-preview-seed').src, 'images/oak/seed.png');
setupDone.events.click();
assert.equal(combinedSetup.run('gameStarted'), true);
assert.equal(combinedSetup.run('selectedColor'), 'red');
assert.equal(combinedSetup.run('selectedSeedType'), 'oak');
assert.equal(combinedSetup.elements.get('.color-dialog').open, false);
console.log('Combined setup previews color and seed, supports changing selections, and starts only on Done.');

for (const randomValue of [0, 0.99]) {
    const randomPlayers = game();
    randomPlayers.run(`Math.random = () => ${randomValue}`);
    randomPlayers.elements.get('.menu-normal-button').events.click();
    randomPlayers.elements.get('.player-count-slider').value = '2';
    randomPlayers.elements.get('.player-count-slider').events.input();
    randomPlayers.elements.get('.choose-green').events.click();
    randomPlayers.elements.get('.choose-seed-birch').events.click();
    randomPlayers.elements.get('.setup-done-button').events.click();
    assert.equal(randomPlayers.run('activeBoardColors[0]'), 'green');
    assert.equal(randomPlayers.run('activeBoardColors[1]'), randomValue === 0 ? 'red' : 'yellow');
    assert.equal(randomPlayers.run('plantedSeeds[0].treeType'), 'birch');
    assert.equal(randomPlayers.run('plantedSeeds[1].treeType'), randomValue === 0 ? 'maple' : 'oak');
    const savedRandomPlayers = randomPlayers.storage.get('tree-planting-game-save');
    const resumedRandomPlayers = game(savedRandomPlayers);
    assert.equal(JSON.stringify(resumedRandomPlayers.run('activeBoardColors')), JSON.stringify(randomPlayers.run('activeBoardColors')));
    assert.equal(JSON.stringify(resumedRandomPlayers.run('plantedSeeds.map(seed => seed.treeType)')), JSON.stringify(randomPlayers.run('plantedSeeds.map(seed => seed.treeType)')));
}
console.log('Other player colors and seed types are randomized, preserve the chosen player, and stay fixed on reload.');

for (const count of [1, 2, 3]) {
    for (const firstColor of ['green', 'yellow', 'red']) {
        const turns = game();
        turns.elements.get('.menu-normal-button').events.click();
        turns.elements.get('.player-count-slider').value = String(count);
        turns.elements.get('.player-count-slider').events.input();
        turns.elements.get(`.choose-${firstColor}`).events.click();
        turns.elements.get('.choose-seed-birch').events.click();
        turns.elements.get('.setup-done-button').events.click();
        turns.run('humanColor = null'); // Exercise the underlying turn rotation independently of bot scheduling.
        const order = ['green', 'yellow', 'red'].filter(color => turns.run('activeBoardColors').includes(color));
        for (let turn = 0; turn < count * 2; turn++) {
            const color = turns.run('selectedColor');
            const balance = turns.run('moneyInCents');
            const income = turns.run('getCurrentPlayerIncome()');
            const nextColor = order[(order.indexOf(color) + 1) % order.length];
            const otherTree = turns.run('plantedSeeds.find(seed => !canManageTree(seed))');
            if (otherTree) {
                turns.run('{ const other = plantedSeeds.find(seed => !canManageTree(seed)); upgradeSeed(other); compostTree(other); }');
                assert.equal(turns.run('moneyInCents'), balance);
                assert.equal(turns.run('plantedSeeds.length'), count);
                assert.equal(otherTree.upgradesInStage, 0);
            }
            turns.elements.get('.done-button').events.click();
            assert.equal(turns.run('selectedColor'), nextColor);
            assert.equal(turns.run(`playerStates.find(player => player.color === "${color}").moneyInCents`), balance + income);
            assert.equal(turns.run('selectedSeedType'), turns.run('playerStates.find(player => player.color === selectedColor).seedType'));
            assert.equal(turns.run('moneyInCents'), turns.run('playerStates.find(player => player.color === selectedColor).moneyInCents'));
            assert.equal(turns.elements.get(`.plant-${turns.run('selectedSeedType')}-button`).hidden, false);
            const resumedTurn = game(turns.storage.get('tree-planting-game-save'));
            assert.equal(resumedTurn.run('selectedColor'), nextColor);
            assert.equal(resumedTurn.run('moneyInCents'), turns.run('moneyInCents'));
            assert.equal(JSON.stringify(resumedTurn.run('playerStates')), JSON.stringify(turns.run('playerStates')));
        }
        turns.run('while (plantedSeeds.some(canManageTree)) compostTree(plantedSeeds.find(canManageTree))');
        assert.equal(turns.run('getCurrentPlayerIncome()'), 0);
        assert.equal(turns.elements.get('.done-button').disabled, false);
        const emptyColor = turns.run('selectedColor');
        turns.elements.get('.done-button').events.click();
        assert.equal(turns.run('selectedColor'), order[(order.indexOf(emptyColor) + 1) % order.length]);
    }
}
const ownedExpansion = game();
ownedExpansion.elements.get('.menu-normal-button').events.click();
ownedExpansion.elements.get('.choose-green').events.click();
ownedExpansion.elements.get('.choose-seed-maple').events.click();
ownedExpansion.elements.get('.setup-done-button').events.click();
ownedExpansion.elements.get('.buy-tile-button').events.click();
assert.equal(ownedExpansion.run('purchasedTileCoordinates[0].color'), 'green');
ownedExpansion.elements.get('.done-button').events.click();
assert.equal(ownedExpansion.run('selectedColor'), 'yellow');
assert.equal(ownedExpansion.run('getBoardTileColor(purchasedTileCoordinates[0].q, purchasedTileCoordinates[0].r)'), 'green');
assert.equal(ownedExpansion.run('getPlantableTiles().some(tile => tile.q === purchasedTileCoordinates[0].q && tile.r === purchasedTileCoordinates[0].r)'), false);
const expansionResume = game(ownedExpansion.storage.get('tree-planting-game-save'));
assert.equal(expansionResume.run('getBoardTileColor(purchasedTileCoordinates[0].q, purchasedTileCoordinates[0].r)'), 'green');
console.log('Done rotates clockwise for every player count, preserves independent balances and seeds, blocks other-player tree actions, allows empty turns, and saves purchased-tile ownership.');

function installBotClock(session) {
    session.run('window.botTimers = []; window.setTimeout = (callback) => window.botTimers.push(callback)');
}
function finishBotTurns(session) {
    let ticks = 0;
    while (session.run('isBotTurn() && window.botTimers.length > 0') && ticks++ < 100) {
        session.run('window.botTimers.shift()()');
    }
    assert.ok(ticks < 100, 'Bots must finish their turns');
    assert.equal(session.run('isBotTurn()'), false);
}
for (const count of [1, 2, 3]) {
    for (const color of ['green', 'yellow', 'red']) {
        const bots = game();
        bots.run(`playerCount = ${count}; moneyInCents = 1000; startNewGame(false, '${color}', false, 'maple')`);
        installBotClock(bots);
        const humanTrees = bots.run('JSON.stringify(plantedSeeds.filter(canManageTree).map(({stageIndex, upgradesInStage}) => ({stageIndex, upgradesInStage})))');
        bots.elements.get('.done-button').events.click();
        if (count > 1) {
            assert.equal(bots.elements.get('.done-button').disabled, true);
            const before = bots.storage.get('tree-planting-game-save');
            bots.run('plantSeed(); upgradeSeed(plantedSeeds.find(canManageTree)); compostTree(plantedSeeds.find(canManageTree)); collectPayout()');
            assert.equal(bots.storage.get('tree-planting-game-save'), before, 'Human inputs cannot play a bot turn');
            const resume = game(before);
            installBotClock(resume);
            resume.run('scheduleBotTurn()');
            finishBotTurns(resume);
            assert.equal(resume.run('selectedColor'), color);
        }
        finishBotTurns(bots);
        assert.equal(bots.run('selectedColor'), color);
        assert.equal(bots.run('moneyInCents'), 1100);
        assert.equal(bots.run('plantedSeeds.length'), count * 2 - 1);
        assert.equal(bots.run('JSON.stringify(plantedSeeds.filter(canManageTree).map(({stageIndex, upgradesInStage}) => ({stageIndex, upgradesInStage})))'), humanTrees);
        assert.equal(bots.run('playerStates.every(player => player.moneyInCents >= 0)'), true);
        if (count > 1) assert.equal(bots.run('plantedSeeds.some(seed => !canManageTree(seed) && (seed.upgradesInStage > 0 || seed.stageIndex === 1))'), true);
        assert.equal(bots.elements.get('.done-button').disabled, false);
    }
}
const compostBot = game();
compostBot.run(`moneyInCents = 1000; startNewGame(false, 'green', false, 'maple');
    for (const tile of [...availableTiles].filter(tile => getBoardTileColor(tile.q, tile.r) === 'yellow')) {
        addPlantedSeed({ x: tile.x, y: tile.y, treeType: 'maple', stageIndex: maximumGrowthStage, upgradesInStage: 0 });
    }`);
installBotClock(compostBot);
compostBot.run('collectPayout(); window.botTimers.shift()()');
assert.equal(compostBot.run('plantedSeeds.filter(seed => getBoardTileColor(seed.tile.q, seed.tile.r) === "yellow").length'), 6);
assert.match(compostBot.elements.get('.payout-status').textContent, /composted/);
finishBotTurns(compostBot);
assert.equal(compostBot.run('plantedSeeds.filter(seed => getBoardTileColor(seed.tile.q, seed.tile.r) === "yellow").length'), 7);
compostBot.run('collectPayout(); startNewGame(true)');
const afterReset = compostBot.storage.get('tree-planting-game-save');
compostBot.run('while (window.botTimers.length) window.botTimers.shift()()');
assert.equal(compostBot.storage.get('tree-planting-game-save'), afterReset);
console.log('Bots plant, upgrade, compost, auto-pass, preserve human ownership on reload, block manual actions, and cancel on game reset.');

for (const color of ['green', 'yellow', 'red']) {
    const expansion = game();
    expansion.run(`moneyInCents = 5000; startNewGame(false, '${color}', false, 'maple')`);
    assert.ok(expansion.run('purchaseTileElements.size') > 0);
    assert.equal(expansion.run(`getPurchaseCandidates().every(({q, r}) => !boardTileKeys.has(getTileKey(q, r)) && Math.max(Math.abs(q), Math.abs(r), Math.abs(q+r)) <= 5)`), true);
    expansion.run('window.targetHex = getPurchaseCandidates()[0]; window.oldHex = purchaseTileElements.get(getTileKey(window.targetHex.q, window.targetHex.r)); window.oldHex.events.click()');
    assert.equal(expansion.run('moneyInCents'), 2500);
    assert.equal(expansion.run('getBoardTileColor(window.targetHex.q, window.targetHex.r)'), color);
    assert.equal(expansion.run('purchaseTileElements.has(getTileKey(window.targetHex.q, window.targetHex.r))'), false);
    assert.equal(expansion.run('getPlantableTiles().some(tile => tile.q === window.targetHex.q && tile.r === window.targetHex.r)'), expansion.run('!tileObstacles.has(getTileKey(window.targetHex.q, window.targetHex.r)) && !plantedSeeds.some(seed => seed.tile.q === window.targetHex.q && seed.tile.r === window.targetHex.r)'));
    expansion.run('window.oldHex.events.click()');
    assert.equal(expansion.run('moneyInCents'), 2500, 'Repeated clicks must not charge twice');
    const restored = game(expansion.storage.get('tree-planting-game-save'));
    assert.equal(restored.run('purchasedTileCoordinates.length'), 1);
    assert.equal(restored.run('purchasedTileCoordinates[0].color'), color);
    assert.ok(restored.run('purchaseTileElements.size') > 0);
    expansion.run('{ const {q, r} = getPurchaseCandidates()[0]; purchaseTileElements.get(getTileKey(q, r)).events.keydown({ key: "Enter", preventDefault() {} }); }');
    assert.equal(expansion.run('moneyInCents'), 0);
    expansion.run('purchaseTileElements.values().next().value.events.click()');
    assert.equal(expansion.run('purchasedTileCoordinates.length'), 2);
    expansion.run('moneyInCents = 5000; collectPayout(); purchaseTileElements.values().next().value.events.click()');
    assert.equal(expansion.run('purchasedTileCoordinates.length'), 2, 'Bot turns cannot purchase human tiles');
    expansion.run('startNewGame(true)');
    assert.equal(expansion.run('purchaseTileElements.size'), 0);
}
console.log('Grey expansion hexes purchase the selected space for 25 leaves, enforce affordability, support keyboard input, and persist ownership.');

for (const count of [1, 2, 3]) {
    const largeBoard = game();
    largeBoard.run(`playerCount = ${count}; moneyInCents = 5000; startNewGame(false, 'green', false, 'maple')`);
    assert.equal(largeBoard.run('purchaseTileElements.size + boardTileKeys.size'), 91);
    assert.equal(largeBoard.run('getGreyTileCoordinates().filter(tile => tile.q === 5).length'), 6);
    assert.equal(largeBoard.run('getGreyTileCoordinates().filter(tile => tile.r === -5).length'), 6);
    largeBoard.run('purchaseTileElements.get("5,0").events.click()');
    assert.equal(largeBoard.run('moneyInCents'), 2500);
    largeBoard.run('{ const {q, r} = getPurchaseCandidates()[0]; purchaseTile(q, r); }');
    assert.equal(largeBoard.run('purchaseTileElements.size + boardTileKeys.size'), 91);
    assert.equal(largeBoard.run('moneyInCents'), 0);
    const loaded = game(largeBoard.storage.get('tree-planting-game-save'));
    assert.equal(loaded.run('purchaseTileElements.size + boardTileKeys.size'), 91);
    largeBoard.run('collectPayout()');
    assert.equal(largeBoard.run('purchaseTileElements.size + boardTileKeys.size'), 91);
}
console.log('All player counts share a fixed 91-space hexagon with six tiles per side; purchases and reloads retain its outline.');

const fog = game();
fog.run(`Math.random = () => 0; moneyInCents = 20000; startNewGame(false, 'green', false, 'maple')`);
assert.equal(fog.run('tileObstacles.size'), 69, 'All grey spaces can contain obstacles');
assert.equal(fog.run('tileObstacles.get("5,0").element.style.display'), 'none');
assert.equal(fog.run('tileObstacles.get("5,0").element.getAttribute("tabindex")'), '-1');
fog.run('openObstacleDialog("5,0"); activateObstacle(5,0); clearTileObstacle(5,0)');
assert.notEqual(fog.elements.get('.obstacle-dialog').open, true);
assert.equal(fog.run('moneyInCents'), 20000);
fog.run('window.near = getPurchaseCandidates().find(tile => isObstacleVisible(tile)); window.nearKey = getTileKey(window.near.q, window.near.r)');
assert.equal(fog.run('tileObstacles.get(window.nearKey).element.style.display'), '');
fog.run('window.hiddenBefore = [...tileObstacles.values()].filter(obstacle => !isObstacleVisible(obstacle)).map(({q,r}) => getTileKey(q,r)); activateObstacle(window.near.q, window.near.r)');
assert.equal(fog.run('moneyInCents'), 17500);
assert.equal(fog.run('getPlantableTiles().some(({q,r}) => getTileKey(q,r) === window.nearKey)'), false);
assert.equal(fog.run('window.hiddenBefore.some(key => isObstacleVisible(tileObstacles.get(key)))'), true);
fog.run('activateObstacle(window.near.q, window.near.r)');
assert.equal(fog.run('moneyInCents'), 16500);
assert.equal(fog.run('tileObstacles.has(window.nearKey)'), false);
assert.equal(fog.run('getPlantableTiles().some(({q,r}) => getTileKey(q,r) === window.nearKey)'), true);
const fogSave = fog.storage.get('tree-planting-game-save');
const fogResume = game(fogSave);
assert.equal(fogResume.run('gameStarted'), true);
assert.equal(JSON.stringify(JSON.parse(fogResume.storage.get('tree-planting-game-save')).obstacles), JSON.stringify(JSON.parse(fogSave).obstacles));
assert.equal(fogResume.run('tileObstacles.get("5,0").element.style.display'), 'none');
fogResume.run('collectPayout()');
assert.equal(fogResume.run('tileObstacles.get("5,0").element.style.display'), 'none', 'Bot turns must not reveal remote obstacles');
const invalidFog = JSON.parse(fogSave);
invalidFog.obstacles.push({q: 6, r: 0, type: 'rock'});
assert.equal(game(JSON.stringify(invalidFog)).run('gameStarted'), false);
console.log('Grey obstacles stay hidden until adjacent, reveal on expansion, require purchase before clearing, block planting, and persist without rerolling.');

const expandingBot = game();
expandingBot.run(`Math.random = () => 0; moneyInCents = 1000; startNewGame(false, 'green', false, 'maple');
    playerStates.find(player => player.color === 'yellow').moneyInCents = 4000;
    for (const tile of [...availableTiles].filter(({q,r}) => getBoardTileColor(q,r) === 'yellow')) {
        addPlantedSeed({x: tile.x, y: tile.y, treeType: 'maple', stageIndex: 0, upgradesInStage: 0});
    }
    window.botTarget = getPurchaseCandidates('yellow')[0];
    window.botTargetKey = getTileKey(window.botTarget.q, window.botTarget.r);`);
installBotClock(expandingBot);
expandingBot.run('collectPayout()');
expandingBot.run('purchaseTile(window.botTarget.q, window.botTarget.r)');
assert.equal(expandingBot.run('purchasedTileCoordinates.length'), 0, 'Manual purchases stay blocked during bot turns');
expandingBot.run('window.botTimers.shift()()');
assert.equal(expandingBot.run('purchasedTileCoordinates.length'), 1);
assert.equal(expandingBot.run('getBoardTileColor(window.botTarget.q, window.botTarget.r)'), 'yellow');
assert.equal(expandingBot.run('moneyInCents'), 1500);
assert.equal(expandingBot.run('tileObstacles.has(window.botTargetKey)'), true);
assert.equal(expandingBot.elements.get('.money-amount').textContent, '11');
expandingBot.run('window.botTimers.shift()()');
assert.equal(expandingBot.run('tileObstacles.has(window.botTargetKey)'), false);
assert.equal(expandingBot.run('moneyInCents'), 500);
expandingBot.run('window.botTimers.shift()()');
assert.equal(expandingBot.run('plantedSeeds.some(seed => getTileKey(seed.tile.q, seed.tile.r) === window.botTargetKey)'), true);
assert.equal(expandingBot.run('moneyInCents'), 400);
finishBotTurns(expandingBot);
assert.equal(expandingBot.run('moneyInCents'), 1100);
assert.equal(expandingBot.run('playerStates.every(player => player.moneyInCents >= 0)'), true);
const expandedBotResume = game(expandingBot.storage.get('tree-planting-game-save'));
assert.equal(expandedBotResume.run('purchasedTileCoordinates[0].color'), 'yellow');
assert.equal(expandedBotResume.run('tileObstacles.has(getTileKey(purchasedTileCoordinates[0].q, purchasedTileCoordinates[0].r))'), false);
console.log('Bots buy adjacent tiles with their own balance, clear obstacles, plant on the cleared land, and preserve ownership on reload.');

const treeObstacles = game();
assert.equal(treeObstacles.run(`(() => {
    let trees = 0;
    for (let i = 0; i < 100; i++) {
        const rolls = [(i + 0.5) / 100, 0];
        Math.random = () => rolls.shift();
        if (randomObstacleDefinition().stageIndex !== undefined) trees++;
    }
    return trees;
})()`), 40, '40% of obstacle rolls choose trees, independently of the spawn chance');
treeObstacles.run(`Math.random = () => 0.5; moneyInCents = 20000; startNewGame(false, 'green', false, 'maple');
    window.treePositions = getGreyTileCoordinates();
    treeObstacleDefinitions.forEach((definition, index) => {
        const {q, r} = window.treePositions[index];
        addTileObstacle(q, r, definition.key);
    });
    saveGame();`);
assert.equal(treeObstacles.run('tileObstacles.size'), 24);
assert.equal(treeObstacles.run('plantedSeeds.length'), 3, 'Obstacle trees do not become income-producing trees');
assert.equal(treeObstacles.run('getCurrentPlayerIncome()'), 100);
const treeObstacleResume = game(treeObstacles.storage.get('tree-planting-game-save'));
assert.equal(treeObstacleResume.run('tileObstacles.size'), 24);
assert.equal(treeObstacleResume.run('treeObstacleDefinitions.every(definition => [...tileObstacles.values()].some(obstacle => obstacle.key === definition.key && obstacle.element.getAttribute("href") === definition.image))'), true);
treeObstacleResume.run(`window.treeHex = getPurchaseCandidates()[0];
    if (!tileObstacles.has(getTileKey(window.treeHex.q, window.treeHex.r))) addTileObstacle(window.treeHex.q, window.treeHex.r, 'tree-oak-5');
    window.treeKey = getTileKey(window.treeHex.q, window.treeHex.r);
    window.claimedDefinition = tileObstacles.get(window.treeKey);
    purchaseTile(window.treeHex.q, window.treeHex.r);`);
assert.equal(treeObstacleResume.run('getPlantableTiles().some(({q,r}) => getTileKey(q,r) === window.treeKey)'), false);
treeObstacleResume.run('clearTileObstacle(window.treeHex.q, window.treeHex.r)');
assert.equal(treeObstacleResume.run('moneyInCents'), 17500);
assert.equal(treeObstacleResume.run('tileObstacles.has(window.treeKey)'), false);
assert.equal(treeObstacleResume.run('plantedSeeds.some(seed => getTileKey(seed.tile.q, seed.tile.r) === window.treeKey && seed.treeType === window.claimedDefinition.treeType && seed.stageIndex === window.claimedDefinition.stageIndex)'), true);
assert.equal(treeObstacleResume.run('getCurrentPlayerIncome()'), treeObstacleResume.run('100 + treeGrowthStages[window.claimedDefinition.treeType][window.claimedDefinition.stageIndex].earningInCents'));
const claimedResume = game(treeObstacleResume.storage.get('tree-planting-game-save'));
assert.equal(claimedResume.run('getCurrentPlayerIncome()'), treeObstacleResume.run('getCurrentPlayerIncome()'));
treeObstacleResume.run('window.claimIncome = getCurrentPlayerIncome(); collectPayout()');
assert.equal(treeObstacleResume.run('playerStates.find(player => player.color === humanColor).moneyInCents'), treeObstacleResume.run('17500 + window.claimIncome'));
console.log('40% of obstacle selections are trees; all 24 species/stage variants save, reload, retain species and stage when purchased, and earn income for their owner.');

const treeBuyerBot = game();
treeBuyerBot.run(`Math.random = () => 0.5; moneyInCents = 1000; startNewGame(false, 'green', false, 'maple');
    for (const tile of [...availableTiles].filter(({q,r}) => getBoardTileColor(q,r) === 'yellow')) {
        addPlantedSeed({x: tile.x, y: tile.y, treeType: 'maple', stageIndex: 0, upgradesInStage: 0});
    }
    getPurchaseCandidates('yellow').forEach(({q,r}) => addTileObstacle(q,r,'tree-oak-5'));
    playerStates.find(player => player.color === 'yellow').moneyInCents = 2500;`);
installBotClock(treeBuyerBot);
treeBuyerBot.run('collectPayout(); window.beforeIncome = getCurrentPlayerIncome(); window.botTimers.shift()()');
assert.equal(treeBuyerBot.run('moneyInCents'), 0, 'A bot can buy a tree tile without reserving removal or planting money');
assert.equal(treeBuyerBot.run('purchasedTileCoordinates[0].color'), 'yellow');
assert.equal(treeBuyerBot.run('getCurrentPlayerIncome()'), treeBuyerBot.run('window.beforeIncome + 600'));
finishBotTurns(treeBuyerBot);
assert.equal(treeBuyerBot.run('playerStates.find(player => player.color === "yellow").moneyInCents'), treeBuyerBot.run('window.beforeIncome + 600'));
assert.equal(treeBuyerBot.run('getCurrentPlayerIncome()'), 100);
console.log('Bots acquire tree obstacles for just the tile price and receive their income without paying removal costs.');

const forfeitGame = game();
forfeitGame.run(`Math.random = () => 0.5; moneyInCents = 5000; startNewGame(false, 'green', false, 'maple');
    purchaseTile(5,0); window.humanTree = plantedSeeds.find(canManageTree); window.humanTile = window.humanTree.tile;`);
installBotClock(forfeitGame);
forfeitGame.elements.get('.forfeit-button').events.click();
assert.equal(forfeitGame.run('playerStates.find(player => player.color === "green").eliminated'), true);
assert.equal(forfeitGame.run('selectedColor'), 'yellow');
assert.equal(forfeitGame.run('getBoardTileColor(5,0)'), 'grey');
assert.equal(forfeitGame.run('boardTileCoordinates.filter(({q,r}) => getBoardTileColor(q,r) === "grey").length'), 8);
assert.equal(forfeitGame.run('tileElements.get("5,0").getAttribute("data-color")'), 'grey');
assert.equal(forfeitGame.elements.get('.forfeit-button').disabled, true);
assert.match(forfeitGame.elements.get('.turn-indicator').textContent, /Spectating/);
const spectatorSave = forfeitGame.storage.get('tree-planting-game-save');
forfeitGame.run('plantSeed(); collectPayout(); upgradeSeed(window.humanTree); compostTree(window.humanTree); purchaseTile(4,0); forfeitPlayer()');
assert.equal(forfeitGame.storage.get('tree-planting-game-save'), spectatorSave, 'Spectators cannot act for the bots');
const spectatorResume = game(spectatorSave);
assert.equal(spectatorResume.run('gameStarted'), true);
assert.equal(spectatorResume.run('getBoardTileColor(5,0)'), 'grey');
assert.equal(spectatorResume.run('playerStates.find(player => player.color === "green").eliminated'), true);
assert.match(spectatorResume.elements.get('.turn-indicator').textContent, /Spectating/);
forfeitGame.run(`performingBotAction = true; moneyInCents = 5000;
    purchaseTile(window.humanTile.q, window.humanTile.r); collectPayout(); collectPayout(); performingBotAction = false;`);
assert.equal(forfeitGame.run('selectedColor'), 'yellow', 'Turns skip the eliminated human');
assert.equal(forfeitGame.run('getBoardTileColor(window.humanTile.q, window.humanTile.r)'), 'yellow');
assert.equal(forfeitGame.run('playerStates.find(player => player.color === "green").moneyInCents'), 2500, 'Forfeited players never collect income');
const reclaimedResume = game(forfeitGame.storage.get('tree-planting-game-save'));
assert.equal(reclaimedResume.run('tileOwnership.get(getTileKey(plantedSeeds[0].tile.q, plantedSeeds[0].tile.r))'), 'yellow');
forfeitGame.run('performingBotAction = true; forfeitPlayer(); performingBotAction = false');
assert.equal(forfeitGame.run('gameIsOver()'), true);
assert.match(forfeitGame.elements.get('.turn-indicator').textContent, /Red wins/);
const finishedSave = forfeitGame.storage.get('tree-planting-game-save');
forfeitGame.run('while (window.botTimers.length) window.botTimers.shift()(); collectPayout()');
assert.equal(forfeitGame.storage.get('tree-planting-game-save'), finishedSave);
assert.equal(game(finishedSave).run('gameIsOver()'), true);

const bankruptBot = game();
bankruptBot.run(`Math.random = () => 0.5; moneyInCents = 1000; startNewGame(false, 'green', false, 'maple');
    plantedSeeds.filter(seed => getBoardTileColor(seed.tile.q,seed.tile.r) === 'yellow').forEach(seed => {
        seed.image.remove(); plantedSeeds.splice(plantedSeeds.indexOf(seed),1); availableTiles.push(seed.tile);
    });
    playerStates.find(player => player.color === 'yellow').moneyInCents = 0;`);
installBotClock(bankruptBot);
bankruptBot.run('collectPayout(); window.botTimers.shift()()');
assert.equal(bankruptBot.run('playerStates.find(player => player.color === "yellow").eliminated'), true);
assert.equal(bankruptBot.run('selectedColor'), 'red');
assert.equal(bankruptBot.run('boardTileCoordinates.filter(({q,r}) => getBoardTileColor(q,r) === "grey").length'), 7);
const soloForfeit = game();
soloForfeit.run(`playerCount = 1; startNewGame(false, 'green', false, 'maple'); forfeitPlayer()`);
assert.equal(soloForfeit.run('gameIsOver()'), true);
assert.equal(soloForfeit.run('getCurrentPlayerIncome()'), 0);
assert.equal(soloForfeit.elements.get('.done-button').disabled, true);
console.log('Forfeit releases tiles, freezes eliminated balances, skips turns, persists spectators and reclaimed land, handles bot bankruptcy, and stops at game over.');
