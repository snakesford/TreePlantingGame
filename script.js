const tiles = document.querySelector(".hex-tiles");
const tileElements = new Map();
const purchaseTileElements = new Map();
let pressedTreeTile = null;
let tilePressOverlay = null;

function pressTile(key, event, target) {
    if (event.button !== 0) return;
    releasePressedTreeTile();
    pressedTreeTile = tileElements.get(key);
    if (!pressedTreeTile) return;
    tilePressOverlay = document.createElementNS(svgNamespace, "polygon");
    tilePressOverlay.setAttribute("class", "tile-press-overlay");
    tilePressOverlay.setAttribute("points", pressedTreeTile.getAttribute("data-points"));
    // Paint above the tree artwork so the feedback stays visible at every stage.
    tiles.append(tilePressOverlay);
    target.setPointerCapture(event.pointerId);
}

function releasePressedTreeTile() {
    if (tilePressOverlay) tilePressOverlay.remove();
    tilePressOverlay = null;
    pressedTreeTile = null;
}

window.addEventListener("pointerup", releasePressedTreeTile);
window.addEventListener("pointercancel", releasePressedTreeTile);
window.addEventListener("blur", releasePressedTreeTile);
const levelProgress = document.querySelector(".level-progress");
const levelLabel = document.querySelector(".level-label");
const nextLevelButton = document.querySelector(".next-level-button");
let currentLevel = 1;
let normalMode = true;
let naturalExpansion = false;
const disasterTurnLimit = 10;
let disasterTurns = 0;
let pendingNaturalExpansion = false;
let levelOneCompleted = false;
let levelTwoCompleted = false;
const completedLevels = new Set();
let matureTreesComposted = 0;
const levelObjective = document.querySelector(".level-objective");
const levelProgressText = document.querySelector(".level-progress-text");
const levelNotification = document.querySelector(".level-notification");
const moneyAmount = document.querySelector(".money-amount");
let compostHighlightVersion = 0;
const plantMapleButton = document.querySelector(".plant-maple-button");
const plantBirchButton = document.querySelector(".plant-birch-button");
const plantSpruceButton = document.querySelector(".plant-spruce-button");
const plantOakButton = document.querySelector(".plant-oak-button");
const buyTileButton = document.querySelector(".buy-tile-button");
const doneButton = document.querySelector(".done-button");
const payoutAmount = document.querySelector(".payout-amount");
const payoutStatus = document.querySelector(".payout-status");
const payoutControls = document.querySelector(".payout-controls");
const saveSlotDialog = document.querySelector(".save-slot-dialog");
const saveSlotSummary = document.querySelector(".save-slot-summary");
const continueGameButton = document.querySelector(".continue-game-button");
const newGameButton = document.querySelector(".new-game-button");
const tutorialButton = document.querySelector(".tutorial-button");
const menuToggle = document.querySelector(".menu-toggle");
const menuPanel = document.querySelector(".game-menu-panel");

function setGameMenuOpen(open) {
    menuPanel.hidden = !open;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close game menu" : "Open game menu");
}

menuToggle.addEventListener("click", () => {
    setGameMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});
document.querySelector(".game-menu").addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        setGameMenuOpen(false);
        menuToggle.focus();
    }
});
document.querySelector(".menu-normal-button").addEventListener("click", () => {
    setGameMenuOpen(false);
    startNewGame();
});
document.querySelector(".menu-natural-button").addEventListener("click", () => {
    setGameMenuOpen(false);
    startNewGame(false, null, false, null, true);
});
document.querySelector(".menu-tutorial-button").addEventListener("click", () => {
    setGameMenuOpen(false);
    startNewGame(true);
});
document.querySelector(".menu-level-button").addEventListener("click", () => {
    setGameMenuOpen(false);
    startNewGame(false, null, true);
});
const colorDialog = document.querySelector(".color-dialog");
const playerCountSlider = document.querySelector(".player-count-slider");
const playerCountOutput = document.querySelector(".player-count-output");
let playerCount = 3;
let activeBoardColors = null;
const setupDoneButton = document.querySelector(".setup-done-button");
const setupPreview = document.querySelector(".setup-preview");
const setupPreviewSeed = document.querySelector(".setup-preview-seed");
let pendingSeedType = null;
let selectedSeedType = null;
let plantingSeedType = null;
let pendingColor = null;
let selectedColor = null;
let playerStates = [];
let tileOwnership = new Map();
const forfeitButton = document.querySelector(".forfeit-button");
let humanColor = null;
let botTurnVersion = 0;
let performingBotAction = false;

function updatePlayerCount() {
    const value = Number(playerCountSlider.value);
    playerCount = [1, 2, 3].includes(value) ? value : 3;
    playerCountSlider.value = String(playerCount);
    playerCountOutput.textContent = `${playerCount} ${playerCount === 1 ? "player" : "players"}`;
    playerCountSlider.setAttribute("aria-valuetext", playerCountOutput.textContent);
}

playerCountSlider.addEventListener("input", updatePlayerCount);
let choosingColorForContinue = false;
const tutorialWelcomeDialog = document.querySelector(".tutorial-welcome-dialog");
const tutorialCompleteDialog = document.querySelector(".tutorial-complete-dialog");
let tutorialPromptReady = false;
let tutorialUpgradeSeed = null;
let tutorialUpgradeReady = false;
let tutorialCompostSeed = null;
let tutorialCompostReady = false;
let tutorialCompleted = false;
const saveStatus = document.querySelector(".save-status");
const seedDialog = document.querySelector(".seed-dialog");
const seedDialogTitle = document.querySelector("#seed-dialog-title");
const seedPreviewImage = document.querySelector(".seed-preview img");
const seedDescription = document.querySelector(".sprout-description");
const seedProgressBar = document.querySelector(".seed-progress-bar");
const seedProgressCount = document.querySelector(".seed-progress-count");
const seedUpgradeCost = document.querySelector(".seed-upgrade-cost");
const seedCompostInfo = document.querySelector(".seed-compost-info");
const obstacleDialog = document.querySelector(".obstacle-dialog");
const obstacleDialogTitle = document.querySelector("#obstacle-dialog-title");
const obstaclePreviewImage = document.querySelector(".obstacle-preview img");
const obstacleDescription = document.querySelector(".obstacle-description");
let selectedObstacle = null;
let moneyInCents = 1000;
const seedCostInCents = 100;
const oakSeedCostInCents = 300;
const tileCostInCents = 2500;
const seedUpgradeCostInCents = 50;
const saveStorageKey = "tree-planting-game-save";
const saveVersion = 5;
const growthStages = [
    { name: "Seed", image: "images/seed.png", earningInCents: 10 },
    {
        name: "Germination",
        image: "images/germination.png",
        earningInCents: 20,
        upgradeCostInCents: 150,
    },
    {
        name: "Sprout",
        image: "images/sprout.png",
        earningInCents: 40,
        upgradeCostInCents: 400,
    },
    {
        name: "Seedling",
        image: "images/seedling.png",
        earningInCents: 75,
        upgradeCostInCents: 1000,
    },
    {
        name: "Sapling",
        image: "images/sapling.png",
        earningInCents: 150,
        upgradeCostInCents: 2500,
    },
    {
        name: "Mature Tree",
        image: "images/mature.png",
        earningInCents: 300,
        upgradeCostInCents: 0,
    },
];
const mapleGrowthStages = growthStages.map((stage, index) => ({
    ...stage,
    name: `Maple ${stage.name}`,
    image: [
        "images/maple/seed.png",
        "images/maple/germination.png",
        "images/maple/sprout.png",
        "images/maple/seedling.png",
        "images/maple/sapling.png",
        "images/maple/adult.png",
    ][index],
    earningInCents: [40, 60, 100, 140, 175, 200][index],
    upgradeCostInCents: [50, 150, 300, 500, 800, 0][index],
}));
const birchGrowthStages = growthStages.map((stage, index) => ({
    ...stage,
    name: `Birch ${stage.name}`,
    image: [
        "images/birch/seed.png",
        "images/birch/germination.png",
        "images/birch/sprout.png",
        "images/birch/seedling.png",
        "images/birch/sapling.png",
        "images/birch/adult.png",
    ][index],
    earningInCents: [30, 50, 75, 100, 125, 150][index],
    upgradeCostInCents: [100, 200, 300, 500, 700, 0][index],
}));
const spruceGrowthStages = growthStages.map((stage, index) => ({
    ...stage,
    name: `Spruce ${stage.name}`,
    image: [
        "images/spruce/seed.png",
        "images/spruce/germination.png",
        "images/spruce/sprout.png",
        "images/spruce/seedling.png",
        "images/spruce/sapling.png",
        "images/spruce/adult.png",
    ][index],
    earningInCents: [25, 50, 100, 200, 300, 400][index],
    upgradeCostInCents: [200, 300, 500, 800, 1200, 0][index],
}));
const oakGrowthStages = growthStages.map((stage, index) => ({
    ...stage,
    name: `Oak ${stage.name}`,
    image: [
        "images/oak/seed.png",
        "images/oak/germination.png",
        "images/oak/sprout.png",
        "images/oak/seedling.png",
        "images/oak/sapling.png",
        "images/oak/adult.png",
    ][index],
    earningInCents: [20, 40, 75, 150, 300, 600][index],
    upgradeCostInCents: [300, 500, 800, 1200, 2000, 0][index],
}));
const treeGrowthStages = {
    standard: growthStages,
    maple: mapleGrowthStages,
    birch: birchGrowthStages,
    spruce: spruceGrowthStages,
    oak: oakGrowthStages,
};
const upgradesPerGrowthStage = 4;

function getGrowthStage(seed) {
    return treeGrowthStages[seed.treeType ?? "standard"][seed.stageIndex];
}

function getUpgradesPerStage() {
    return upgradesPerGrowthStage;
}
const maximumGrowthStage = growthStages.length - 1;
let gameStarted = false;
const levelTileCounts = [22, 7, 12, 15, 19, 19, 27, 36];
let startingTileCount = levelTileCounts[0];
let boardLayoutVersion = 2;
const radius = 24;
// Largest centered square inside a pointy-top hex, with room for its border.
const maximumTileImageSize = 2 * (radius - 1.25) / (1 + 1 / Math.sqrt(3));
const centerX = 230;
const centerY = 205;
const svgNamespace = "http://www.w3.org/2000/svg";
const availableTiles = [];
const boardTileCoordinates = [];
const boardTileKeys = new Set();
const purchasedTileCoordinates = [];
const tileObstacles = new Map();
const plantedSeeds = [];
const terrainObstacleDefinitions = [
    { key: "rock", image: "images/rock.png", clearCostInCents: 1000, label: "rock" },
    { key: "boulder", image: "images/boulder.png", clearCostInCents: 3000, label: "boulder" },
    { key: "burnt-tree", image: "images/burnt-tree.png", clearCostInCents: 2500, label: "burnt tree" },
    { key: "river", image: "images/river.svg", clearCostInCents: 1000, label: "river" },
];
const treeObstacleDefinitions = ["maple", "birch", "spruce", "oak"].flatMap(treeType =>
    treeGrowthStages[treeType].map((stage, stageIndex) => ({
        key: `tree-${treeType}-${stageIndex}`,
        treeType,
        image: stage.image,
        label: `${stage.name.toLowerCase()} obstacle`,
        clearCostInCents: Math.max(100, stage.earningInCents * (stageIndex + 1)),
        stageIndex,
    }))
);
const tileObstacleDefinitions = [...terrainObstacleDefinitions, ...treeObstacleDefinitions];
const treeObstacleChance = 0.4;
const tileObstacleChance = 0.2;

function randomObstacleDefinition() {
    const pool = Math.random() >= 1 - treeObstacleChance
        ? treeObstacleDefinitions : terrainObstacleDefinitions;
    return pool[Math.floor(Math.random() * pool.length)];
}
let selectedSeed = null;
let savedGameData = null;
let hasStoredSave = false;

function showLeafAmount(element, amount, prefix = "", suffix = "") {
    const icon = document.createElement("img");
    icon.className = "currency-icon";
    icon.src = "images/sun.png";
    icon.alt = "leaves";
    icon.width = 20;
    icon.height = 20;
    element.replaceChildren(prefix, icon, amount, suffix);
}

function saveGame() {
    updateLevelProgress();
    updateTutorialUpgradePrompt();
    if (!gameStarted) return;

    syncCurrentPlayer();
    const saveData = {
        version: saveVersion,
        tutorialCompleted,
        selectedColor,
        humanColor,
        selectedSeedType,
        normalMode,
        naturalExpansion,
        disasterTurns,
        activeBoardColors,
        playerStates,
        tileOwnership: Array.from(tileOwnership, ([key, color]) => ({ key, color })),
        currentLevel,
        boardTileCount: startingTileCount,
        boardLayoutVersion,
        levelOneCompleted,
        levelTwoCompleted,
        completedLevels: Array.from(completedLevels),
        matureTreesComposted,
        moneyInCents,
        additionalTiles: purchasedTileCoordinates.map(({ q, r, color }) => ({ q, r, color })),
        greyObstaclesGenerated: normalMode,
        obstacles: Array.from(tileObstacles.values()).map(({ q, r, key }) => ({
            q,
            r,
            type: key,
        })),
        seeds: plantedSeeds.map((seed) => ({
            treeType: seed.treeType,
            x: seed.x,
            y: seed.y,
            stageIndex: seed.stageIndex,
            upgradesInStage: seed.upgradesInStage,
        })),
    };

    try {
        localStorage.setItem(saveStorageKey, JSON.stringify(saveData));
        hasStoredSave = true;
        saveStatus.textContent = "";
    } catch (error) {
        saveStatus.textContent = "Unable to save progress in this browser.";
        console.error("Could not save game progress.", error);
    }
}

function readSavedGame() {
    let serializedSave;
    try {
        serializedSave = localStorage.getItem(saveStorageKey);
    } catch (error) {
        saveSlotSummary.textContent =
            "Saved games are unavailable in this browser.";
        saveStatus.textContent = "Unable to access browser storage.";
        console.error("Could not access saved game.", error);
        return;
    }

    if (!serializedSave) {
        saveSlotSummary.textContent = "Empty slot. Start a new game to begin.";
        continueGameButton.hidden = true;
        hasStoredSave = false;
        return;
    }

    hasStoredSave = true;
    try {
        savedGameData = JSON.parse(serializedSave);
    } catch (error) {
        saveSlotSummary.textContent =
            "This save slot could not be read. Starting a new game will replace it.";
        continueGameButton.hidden = true;
        console.error("Saved game data is not valid JSON.", error);
        return;
    }

    if (!isValidSaveData(savedGameData)) {
        saveSlotSummary.textContent =
            "This save slot is invalid. Starting a new game will replace it.";
        savedGameData = null;
        continueGameButton.hidden = true;
        return;
    }

    if (savedGameData.version < saveVersion) {
        savedGameData.seeds.forEach((seed) => {
            // Retired growth stages become Mature without losing the tree.
            if (seed.stageIndex >= maximumGrowthStage) {
                seed.stageIndex = maximumGrowthStage;
                seed.upgradesInStage = 0;
            }
        });
        savedGameData.version = saveVersion;
    }

    const balance = (savedGameData.moneyInCents / 100).toFixed(2);
    showLeafAmount(saveSlotSummary, balance, "Balance: ", ` · Trees: ${savedGameData.seeds.length}`);
    continueGameButton.hidden = false;
}

function isValidSaveData(data) {
    if (
        !data ||
        typeof data !== "object" ||
        ![1, 2, 3, 4, saveVersion].includes(data.version) ||
        (data.activeBoardColors != null && (!Array.isArray(data.activeBoardColors) ||
            data.activeBoardColors.length < 1 || data.activeBoardColors.length > 3 ||
            new Set(data.activeBoardColors).size !== data.activeBoardColors.length ||
            data.activeBoardColors.some(color => !["red", "green", "yellow"].includes(color)) ||
            !data.activeBoardColors.includes(data.selectedColor) ||
            data.boardTileCount !== (data.naturalExpansion ? 91 : 1 + 7 * data.activeBoardColors.length))) ||
        (data.humanColor != null && (!["red", "green", "yellow"].includes(data.humanColor) ||
            !(data.activeBoardColors ?? [data.selectedColor]).includes(data.humanColor))) ||
        (data.selectedSeedType != null && !["maple", "birch", "spruce", "oak"].includes(data.selectedSeedType)) ||
        (data.normalMode !== undefined && typeof data.normalMode !== "boolean") ||
        (data.naturalExpansion !== undefined && typeof data.naturalExpansion !== "boolean") ||
        (data.naturalExpansion && (data.normalMode !== true || !data.activeBoardColors || data.boardTileCount !== 91)) ||
        (data.selectedColor != null && !["red", "green", "yellow"].includes(data.selectedColor)) ||
        (data.currentLevel !== undefined && (!Number.isInteger(data.currentLevel) || data.currentLevel < 1 || data.currentLevel > 8)) ||
        (data.boardLayoutVersion !== undefined && ![1, 2].includes(data.boardLayoutVersion)) ||
        (data.boardTileCount !== undefined && ![1, 7, 8, 12, 15, 19, 22, 27, 36, 91].includes(data.boardTileCount)) ||
        (data.boardSideLength !== undefined && ![2, 6].includes(data.boardSideLength)) ||
        (data.levelOneCompleted !== undefined && typeof data.levelOneCompleted !== "boolean") ||
        (data.levelTwoCompleted !== undefined && typeof data.levelTwoCompleted !== "boolean") ||
        (data.completedLevels !== undefined && (!Array.isArray(data.completedLevels) ||
            data.completedLevels.some((level) => !Number.isInteger(level) || level < 1 || level > (data.currentLevel ?? 1)))) ||
        (data.matureTreesComposted !== undefined &&
            (!Number.isSafeInteger(data.matureTreesComposted) || data.matureTreesComposted < 0)) ||
        !Number.isFinite(data.moneyInCents) ||
        data.moneyInCents < 0 ||
        !Array.isArray(data.seeds) ||
        (data.additionalTiles !== undefined &&
            !Array.isArray(data.additionalTiles)) ||
        (data.obstacles !== undefined && !Array.isArray(data.obstacles))
    ) {
        return false;
    }

    if (data.playerStates !== undefined && (!Array.isArray(data.playerStates) ||
        data.playerStates.length > 3 ||
        new Set(data.playerStates.map(player => player?.color)).size !== data.playerStates.length ||
        data.playerStates.some(player => !player || !["green", "yellow", "red"].includes(player.color) ||
            (player.eliminated !== undefined && typeof player.eliminated !== "boolean") ||
            !["maple", "birch", "spruce", "oak"].includes(player.seedType) ||
            !Number.isFinite(player.moneyInCents) || player.moneyInCents < 0) ||
        (data.playerStates.length > 0 && (!(data.activeBoardColors ?? [data.selectedColor]).every(color => data.playerStates.some(player => player.color === color)) ||
            !data.playerStates.some(player => player.color === data.selectedColor))))) return false;

    const obstacleTypes = new Set(
        tileObstacleDefinitions.map((obstacle) => obstacle.key)
    );
    const additionalTiles = data.additionalTiles ?? [];
    const obstacleTiles = data.obstacles ?? [];
    const startingTiles = getStartingCoordinates(getSavedStartingTileCount(data), data.boardLayoutVersion ?? 1, data.activeBoardColors ?? null, data.naturalExpansion === true);
    const knownTileKeys = new Set(startingTiles.map(({ q, r }) => getTileKey(q, r)));
    const tilePositions = startingTiles.map(({ q, r }) => getTileCenter(q, r));
    for (const tile of additionalTiles) {
        if (
            !tile ||
            !Number.isInteger(tile.q) ||
            !Number.isInteger(tile.r) ||
            (tile.color !== undefined && !["red", "green", "yellow"].includes(tile.color))
        ) {
            return false;
        }

        const key = `${tile.q},${tile.r}`;
        if (
            knownTileKeys.has(key) ||
            !(data.normalMode !== false && Math.max(Math.abs(tile.q), Math.abs(tile.r), Math.abs(tile.q + tile.r)) <= 5) &&
            !tileNeighborOffsets.some(([qOffset, rOffset]) =>
                knownTileKeys.has(`${tile.q + qOffset},${tile.r + rOffset}`)
            )
        ) {
            return false;
        }

        knownTileKeys.add(key);
        tilePositions.push(getTileCenter(tile.q, tile.r));
    }

    if (data.tileOwnership !== undefined && (!Array.isArray(data.tileOwnership) ||
        new Set(data.tileOwnership.map(tile => tile?.key)).size !== data.tileOwnership.length ||
        data.tileOwnership.some(tile => !tile || !knownTileKeys.has(tile.key) ||
            !["grey", "green", "yellow", "red"].includes(tile.color)))) return false;

    for (const obstacle of obstacleTiles) {
        if (
            !obstacle ||
            !Number.isInteger(obstacle.q) ||
            !Number.isInteger(obstacle.r) ||
            !obstacleTypes.has(obstacle.type) ||
            (!knownTileKeys.has(`${obstacle.q},${obstacle.r}`) &&
                !(data.normalMode !== false && Math.max(Math.abs(obstacle.q), Math.abs(obstacle.r), Math.abs(obstacle.q + obstacle.r)) <= 5))
        ) {
            return false;
        }
    }

    if (data.seeds.length > tilePositions.length) return false;

    const occupiedPositions = new Set();
    return data.seeds.every((seed) => {
        if (
            !seed ||
            !Number.isFinite(seed.x) ||
            !Number.isFinite(seed.y) ||
            (seed.treeType !== undefined && !Object.hasOwn(treeGrowthStages, seed.treeType)) ||
            !Number.isInteger(seed.stageIndex) ||
            seed.stageIndex < 0 ||
            seed.stageIndex > ([1, 3].includes(data.version) ? 6 : maximumGrowthStage) ||
            !Number.isInteger(seed.upgradesInStage) ||
            seed.upgradesInStage < 0 ||
            seed.upgradesInStage >= getUpgradesPerStage(seed)
        ) {
            return false;
        }

        const tileIndex = tilePositions.findIndex(
            (tile) => Math.abs(tile.x - seed.x) < 0.001 &&
                Math.abs(tile.y - seed.y) < 0.001
        );
        if (tileIndex < 0) return false;

        const positionKey = `${tileIndex}`;
        if (occupiedPositions.has(positionKey)) return false;
        occupiedPositions.add(positionKey);
        return true;
    });
}

function updateTutorialUpgradePrompt() {
    const prompt = document.querySelector(".tutorial-upgrade-prompt");
    const seed = plantedSeeds[0];
    const compostPrompt = document.querySelector(".tutorial-compost-prompt");
    const canCompost = startingTileCount === 1 && !tutorialCompleted && seed && seed.stageIndex >= 2;
    if (!canCompost) {
        tutorialCompostSeed = null;
        tutorialCompostReady = false;
    } else if (tutorialCompostSeed !== seed) {
        tutorialCompostSeed = seed;
        tutorialCompostReady = false;
        window.setTimeout(() => {
            if (tutorialCompostSeed !== seed) return;
            tutorialCompostReady = true;
            updateTutorialUpgradePrompt();
        }, 700);
    }
    compostPrompt.hidden = !canCompost || !tutorialCompostReady;
    if (!compostPrompt.hidden) {
        const bounds = tileElements.get(getTileKey(seed.tile.q, seed.tile.r)).getBoundingClientRect();
        const left = bounds.left + bounds.width + 20;
        compostPrompt.style.left = `${left}px`;
        compostPrompt.style.top = `${bounds.top + bounds.height / 2}px`;
        compostPrompt.style.maxWidth = `${Math.max(0, window.innerWidth - left - 12)}px`;
    }
    const sproutPrompt = document.querySelector(".tutorial-sprout-prompt");
    sproutPrompt.hidden = tutorialCompleted || startingTileCount !== 1 || !seed || seed.stageIndex >= 2 ||
        (seed.stageIndex === 0 && seed.upgradesInStage === 0);
    if (!sproutPrompt.hidden) {
        const tile = tileElements.get(getTileKey(seed.tile.q, seed.tile.r));
        const bounds = tile.getBoundingClientRect();
        sproutPrompt.style.left = `${bounds.left - 16}px`;
        sproutPrompt.style.top = `${bounds.top + bounds.height / 2}px`;
        sproutPrompt.style.maxWidth = `${Math.max(0, bounds.left - 28)}px`;
    }
    prompt.hidden = tutorialCompleted || startingTileCount !== 1 || !seed || seed.stageIndex > 0 || seed.upgradesInStage > 0;
    if (prompt.hidden) {
        tutorialUpgradeSeed = null;
        tutorialUpgradeReady = false;
        return;
    }
    if (tutorialUpgradeSeed !== seed) {
        tutorialUpgradeSeed = seed;
        tutorialUpgradeReady = false;
        window.setTimeout(() => {
            if (tutorialUpgradeSeed !== seed) return;
            tutorialUpgradeReady = true;
            updateTutorialUpgradePrompt();
        }, 700);
    }
    prompt.hidden = !tutorialUpgradeReady;
    if (prompt.hidden) return;
    const tile = tileElements.get(getTileKey(seed.tile.q, seed.tile.r));
    const bounds = tile.getBoundingClientRect();
    prompt.style.left = `${bounds.left + bounds.width / 2}px`;
    prompt.style.top = `${bounds.top - 40}px`;
}

window.addEventListener("resize", updateTutorialUpgradePrompt);
window.addEventListener("scroll", updateTutorialUpgradePrompt);

function getPlantableTiles() {
    if (startingTileCount === 22 && !selectedColor) return [];
    return availableTiles.filter(({ q, r }) => !selectedColor || getBoardTileColor(q, r) === selectedColor);
}

function updateMoneyDisplay() {
    updateDisasterMeter();
    plantedSeeds.forEach(updateSeedAppearance);
    updateSeedDialog();
    updateLevelProgress();
    const tutorialActive = startingTileCount === 1;
    plantMapleButton.hidden = false;
    document.querySelector(".game-actions .tutorial-plant-prompt").hidden = tutorialCompleted || !tutorialActive || !tutorialPromptReady || plantedSeeds.length > 0;
    updateTutorialUpgradePrompt();
    [plantBirchButton, plantSpruceButton, plantOakButton, buyTileButton].forEach((button) => {
        button.hidden = tutorialActive;
    });
    if (normalMode) {
        const displayedSeedType = playerStates.find(player => player.color === humanColor)?.seedType ?? selectedSeedType;
        for (const [type, button] of [["maple", plantMapleButton], ["birch", plantBirchButton], ["spruce", plantSpruceButton], ["oak", plantOakButton]]) {
            button.hidden = type !== displayedSeedType;
        }
    }
    const displayedBalance = isBotTurn()
        ? playerStates.find(player => player.color === humanColor)?.moneyInCents ?? 0
        : moneyInCents;
    moneyAmount.textContent = (displayedBalance / 100).toString();
    const noPlantableTiles = getPlantingTargets().length === 0;
    const cannotPlantSeed = moneyInCents < seedCostInCents || noPlantableTiles;
    plantMapleButton.disabled = cannotPlantSeed;
    plantBirchButton.disabled = cannotPlantSeed;
    plantSpruceButton.disabled = cannotPlantSeed;
    plantOakButton.disabled = moneyInCents < oakSeedCostInCents || noPlantableTiles;
    buyTileButton.disabled = moneyInCents < tileCostInCents;
    const income = getCurrentPlayerIncome();
    doneButton.disabled = !gameStarted || (!normalMode && income === 0);
    const turnIndicator = document.querySelector(".turn-indicator");
    turnIndicator.hidden = !normalMode || !selectedColor;
    turnIndicator.textContent = selectedColor ? `${selectedColor[0].toUpperCase() + selectedColor.slice(1)}’s turn` : "";
    if (isBotTurn()) {
        turnIndicator.textContent += " (bot)";
        [plantMapleButton, plantBirchButton, plantSpruceButton, plantOakButton, buyTileButton, doneButton]
            .forEach(button => { button.disabled = true; });
    }
    const spectating = normalMode && playerStates.find(player => player.color === humanColor)?.eliminated;
    if (spectating) turnIndicator.textContent = `Spectating · ${turnIndicator.textContent}`;
    if (gameIsOver()) {
        const winner = playerStates.find(player => !player.eliminated);
        turnIndicator.textContent = winner ? `${winner.color[0].toUpperCase() + winner.color.slice(1)} wins!` : "Game over";
    }
    if (spectating || gameIsOver()) {
        [plantMapleButton, plantBirchButton, plantSpruceButton, plantOakButton, buyTileButton, doneButton]
            .forEach(button => { button.disabled = true; });
    }
    forfeitButton.hidden = !normalMode || !gameStarted;
    forfeitButton.disabled = isBotTurn() || spectating || gameIsOver();
    turnIndicator.setAttribute("data-color", selectedColor ?? "");
    updatePurchaseTiles();
    updatePlantingHighlights();
    updatePlayerRoster();
    payoutAmount.textContent = `${(income / 100).toFixed(2)} leaves per click`;
    doneButton.setAttribute("aria-label", `Done: collect ${(income / 100).toFixed(2)} leaves`);
}

function updatePlayerRoster() {
    const roster = document.querySelector(".player-roster");
    roster.hidden = !normalMode || !gameStarted || playerStates.length === 0;
    if (roster.hidden) {
        roster.replaceChildren();
        return;
    }
    const rosterPlayers = [...playerStates].sort((a, b) => Number(b.color === humanColor) - Number(a.color === humanColor));
    const cards = rosterPlayers.map(player => {
        const name = player.color[0].toUpperCase() + player.color.slice(1);
        const income = player.eliminated ? 0 : plantedSeeds
            .filter(seed => getBoardTileColor(seed.tile.q, seed.tile.r) === player.color)
            .reduce((total, seed) => total + getTreeIncome(seed), 0);
        const card = document.createElement("li");
        card.className = "player-card";
        card.setAttribute("data-active", String(player.color === selectedColor && !player.eliminated && !gameIsOver()));
        card.setAttribute("data-eliminated", String(Boolean(player.eliminated)));
        const avatar = document.createElement("span");
        avatar.className = "player-avatar";
        avatar.setAttribute("data-color", player.color);
        const seed = document.createElement("img");
        seed.src = `images/${player.seedType}/seed.png`;
        seed.alt = `${player.seedType} seed`;
        seed.width = 36;
        seed.height = 36;
        avatar.replaceChildren(seed);
        const details = document.createElement("div");
        details.className = "player-card-details";
        const label = document.createElement("strong");
        label.textContent = `${name}${player.color === humanColor ? " (you)" : ""}${player.eliminated ? " · Out" : ""}`;
        const earnings = document.createElement("span");
        earnings.className = "player-earnings";
        showLeafAmount(earnings, (income / 100).toFixed(2), "", " / turn");
        details.replaceChildren(label, earnings);
        card.replaceChildren(avatar, details);
        return card;
    });
    roster.replaceChildren(...cards);
}

const levelDefinitions = [
    { name: "First Sprouts", objective: "Grow 2 sprouts or earn 2 leaves per payout.", target: 1 },
    { name: "Growing Grove", objective: "Grow 3 trees to Seedling or higher.", stage: 3, target: 3, unit: "seedlings or higher" },
    { name: "Forest Expansion", objective: "Have 8 living trees planted.", target: 8, unit: "living trees" },
    { name: "Stronger Roots", objective: "Grow 3 trees to Sapling or higher.", stage: 4, target: 3, unit: "saplings or higher" },
    { name: "Profitable Forest", objective: "Reach 10 leaves of total income per payout.", target: 1000 },
    { name: "Established Woodland", objective: "Have 5 Mature trees or higher.", stage: 5, target: 5, unit: "mature trees or higher" },
    { name: "Forest Diversity", objective: "Own 3 different species with at least 2 living trees each.", target: 3, unit: "species with 2+ trees" },
    { name: "Forest Renewal", objective: "Compost 2 Mature trees during this level.", target: 2, unit: "mature trees composted" },
];

function updateLevelProgress() {
    const tutorialActive = startingTileCount === 1;
    document.querySelector(".level-row").hidden = normalMode || tutorialActive;
    document.querySelector(".level-indicator").hidden = normalMode || tutorialActive;
    if (normalMode) {
        document.querySelector(".level-details").hidden = true;
        nextLevelButton.hidden = true;
        levelNotification.hidden = true;
        levelNotification.textContent = "";
        levelObjective.textContent = "";
        levelProgressText.textContent = "";
        return;
    }
    document.querySelector(".level-details").hidden = tutorialActive;
    const definition = levelDefinitions[currentLevel - 1];
    const income = plantedSeeds.reduce((total, seed) => total + getTreeIncome(seed), 0);
    let count = plantedSeeds.length;
    let progressText;
    if (currentLevel === 1) {
        const sprouts = plantedSeeds.filter((seed) => seed.stageIndex >= 2).length;
        count = Math.max(sprouts / 2, income / 200);
        progressText = `${sprouts}/2 sprouts or higher · ${(income / 100).toFixed(2)}/2 leaves per payout`;
    } else if (currentLevel === 5) {
        count = income;
        progressText = `${(income / 100).toFixed(2)}/10 leaves per payout`;
    } else if (currentLevel === 7) {
        const species = new Map();
        plantedSeeds.forEach((seed) => {
            species.set(seed.treeType, (species.get(seed.treeType) ?? 0) + 1);
        });
        count = Array.from(species.values()).filter((total) => total >= 2).length;
    } else if (currentLevel === 8) {
        count = matureTreesComposted;
    } else if (definition.stage !== undefined) {
        count = plantedSeeds.filter((seed) => seed.stageIndex >= definition.stage).length;
    }
    if (count >= definition.target) {
        completedLevels.add(currentLevel);
        if (currentLevel === 1) levelOneCompleted = true;
        if (currentLevel === 2) levelTwoCompleted = true;
    }
    const complete = isCurrentLevelComplete();
    levelProgress.value = complete ? 100 : Math.min(100, count / definition.target * 100);
    levelProgress.setAttribute("aria-label", `Level ${currentLevel} progress`);
    const details = progressText ?? `${count}/${definition.target} ${definition.unit}`;
    levelProgress.setAttribute("aria-valuetext", complete ? `Level complete. ${details}` : details);
    levelLabel.textContent = `Level ${currentLevel}`;
    levelObjective.textContent = `${definition.name} — ${definition.objective}`;
    levelProgressText.textContent = details;
    const notification = complete
        ? (currentLevel === 8 ? "Level Complete — All 8 levels completed!" : "Level Complete — Ready for the next level!")
        : "";
    // Only change the live region when the message changes, not on every save.
    if (levelNotification.textContent !== notification) levelNotification.textContent = notification;
    levelNotification.hidden = !complete;
    nextLevelButton.hidden = !complete || currentLevel === levelDefinitions.length;
}

function isCurrentLevelComplete() {
    if (normalMode) return false;
    return completedLevels.has(currentLevel) ||
        (currentLevel === 1 && levelOneCompleted) ||
        (currentLevel === 2 && levelTwoCompleted);
}

function advanceToNextLevel() {
    if (!gameStarted || !isCurrentLevelComplete() || currentLevel >= levelDefinitions.length) return;

    completedLevels.add(currentLevel);
    currentLevel += 1;
    matureTreesComposted = 0;
    startingTileCount = levelTileCounts[currentLevel - 1];
    boardLayoutVersion = [3, 4, 7].includes(currentLevel) ? 1 : 2;
    resetBoard();
    spawnRandomTileObstacles();
    updateMoneyDisplay();
    saveGame();
}

function resetBoard() {
    plantingSeedType = null;
    botTurnVersion += 1;
    closeSeedDialog(selectedSeed);
    closeObstacleDialog(selectedObstacle);
    tiles.replaceChildren();
    releasePressedTreeTile();
    tileElements.clear();
    purchaseTileElements.clear();
    plantedSeeds.length = 0;
    availableTiles.length = 0;
    boardTileCoordinates.length = 0;
    purchasedTileCoordinates.length = 0;
    boardTileKeys.clear();
    tileObstacles.clear();
    createStartingBoard();
    updateBoardViewBox();
}

const tileNeighborOffsets = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
];

function getTileCenter(q, r) {
    return {
        x: centerX + Math.sqrt(3) * radius * (q + r / 2),
        y: centerY + 1.5 * radius * r,
    };
}

function getTileKey(q, r) {
    return `${q},${r}`;
}

function positionHoverDialog(dialog, element, event) {
    const bounds = element.getBoundingClientRect();
    const cursorX = event?.clientX ?? bounds.left + bounds.width / 2;
    const cursorY = event?.clientY ?? bounds.top;
    const margin = 8;
    const left = Math.max(margin, Math.min(
        cursorX - dialog.offsetWidth / 2,
        window.innerWidth - dialog.offsetWidth - margin
    ));
    const top = Math.max(margin, Math.min(
        cursorY - dialog.offsetHeight - 48,
        window.innerHeight - dialog.offsetHeight - margin
    ));
    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;
}

function openObstacleDialog(key, event) {
    const obstacle = tileObstacles.get(key);
    if (!obstacle || !isObstacleVisible(obstacle)) return;
    closeSeedDialog(selectedSeed);
    selectedObstacle = key;
    const name = obstacle.label.charAt(0).toUpperCase() + obstacle.label.slice(1);
    obstacleDialogTitle.textContent = name;
    obstaclePreviewImage.src = obstacle.image;
    obstaclePreviewImage.alt = name;
    const unowned = !boardTileKeys.has(key) || (normalMode && getBoardTileColor(obstacle.q, obstacle.r) === "grey");
    if (obstacle.key === "river") {
        obstacleDescription.textContent = "Plant a seed on this river to produce double sun. Only the tree on this tile gets the bonus. No tile purchase or clearing is needed; pay only the seed cost.";
    } else if (unowned && obstacle.treeType) {
        const income = treeGrowthStages[obstacle.treeType][obstacle.stageIndex].earningInCents;
        showLeafAmount(obstacleDescription, (income / 100).toFixed(2), "Buy this hex for 25 leaves to own this tree. Earns ", " each turn.");
    } else {
        showLeafAmount(obstacleDescription, (obstacle.clearCostInCents / 100).toFixed(2),
            unowned ? "Buy this hex for 25 leaves, then remove for " : "Click to remove for ", ".");
    }
    if (!obstacleDialog.open) obstacleDialog.show();
    positionHoverDialog(obstacleDialog, obstacle.element, event);
}

function closeObstacleDialog(key) {
    if (selectedObstacle !== key) return;
    if (obstacleDialog.open) obstacleDialog.close();
    selectedObstacle = null;
}

function addTileObstacle(q, r, obstacleType = null) {
    if (!normalMode && currentLevel === 1) return false;
    if (!boardTileKeys.has(getTileKey(q, r)) &&
        !(normalMode && Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= 5)) return false;
    const key = getTileKey(q, r);
    if (tileObstacles.has(key)) return false;

    const definition = obstacleType
        ? tileObstacleDefinitions.find((tileObstacle) => tileObstacle.key === obstacleType)
        : randomObstacleDefinition();

    if (!definition) return false;

    const { x, y } = getTileCenter(q, r);
    const obstacleImage = document.createElementNS(svgNamespace, "image");
    const obstacleSize = definition.stageIndex !== undefined
        ? maximumTileImageSize * (0.7 + 0.3 * definition.stageIndex / maximumGrowthStage)
        : definition.key === "boulder" ? 40 :
        definition.key === "rock" ? 36 : 38;
    // Allow larger artwork while clipping its corners to the tile's inner edge.
    const clipPoints = Array.from({ length: 6 }, (_, index) => {
        const angle = ((index * 60 - 90) * Math.PI) / 180;
        const extent = (radius - 1.25) / obstacleSize * 100;
        return `${50 + extent * Math.cos(angle)}% ${50 + extent * Math.sin(angle)}%`;
    }).join(", ");
    obstacleImage.style.clipPath = `polygon(${clipPoints}) fill-box`;

    obstacleImage.setAttribute("class", "tile-obstacle");
    obstacleImage.setAttribute("href", definition.image);
    obstacleImage.setAttribute("x", x - obstacleSize / 2);
    obstacleImage.setAttribute("y", y - obstacleSize / 2);
    obstacleImage.setAttribute("width", obstacleSize);
    obstacleImage.setAttribute("height", obstacleSize);
    obstacleImage.setAttribute(
        "aria-label",
        `Clear ${definition.label} for ${(definition.clearCostInCents / 100).toFixed(2)} leaves.`
    );
    obstacleImage.setAttribute("role", "button");
    obstacleImage.setAttribute("tabindex", "0");
    obstacleImage.addEventListener("mouseenter", (event) => openObstacleDialog(key, event));
    obstacleImage.addEventListener("mousemove", (event) => {
        if (selectedObstacle === key) positionHoverDialog(obstacleDialog, obstacleImage, event);
    });
    obstacleImage.addEventListener("mouseleave", () => closeObstacleDialog(key));
    obstacleImage.addEventListener("focus", () => openObstacleDialog(key));
    obstacleImage.addEventListener("blur", () => closeObstacleDialog(key));
    obstacleImage.addEventListener("click", (event) => {
        event.stopPropagation();
        activateObstacle(q, r);
    });
    obstacleImage.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            activateObstacle(q, r);
        }
    });
    tiles.append(obstacleImage);

    tileObstacles.set(key, { ...definition, q, r, element: obstacleImage });
    updateObstacleVisibility();
    const availableTileIndex = availableTiles.findIndex(
        (tile) => Math.abs(tile.x - x) < 0.001 && Math.abs(tile.y - y) < 0.001
    );
    if (availableTileIndex >= 0 && definition.key !== "river") {
        availableTiles.splice(availableTileIndex, 1);
    }
    return true;
}

function isObstacleVisible({ q, r }) {
    if (!normalMode) return true;
    const owner = humanColor ?? selectedColor;
    const ownedByHuman = (q, r) => boardTileKeys.has(getTileKey(q, r)) && getBoardTileColor(q, r) === owner;
    return ownedByHuman(q, r) || tileNeighborOffsets.some(([dq, dr]) => ownedByHuman(q + dq, r + dr));
}

function updateObstacleVisibility() {
    tileObstacles.forEach((obstacle, key) => {
        const visible = isObstacleVisible(obstacle);
        const unowned = !boardTileKeys.has(key) || (normalMode && getBoardTileColor(obstacle.q, obstacle.r) === "grey");
        obstacle.element.style.display = visible ? "" : "none";
        obstacle.element.setAttribute("aria-hidden", String(!visible));
        obstacle.element.setAttribute("tabindex", visible ? "0" : "-1");
        obstacle.element.setAttribute("aria-label", obstacle.key === "river"
            ? "River: plant a seed here for double sun. No tile purchase needed." : unowned
            ? obstacle.treeType
                ? `Buy hex with ${obstacle.label} for 25 leaves. This tree will earn leaves for you.`
                : `Buy hex with ${obstacle.label} for 25 leaves. Removal costs ${obstacle.clearCostInCents / 100} leaves.`
            : `Clear ${obstacle.label} for ${obstacle.clearCostInCents / 100} leaves.`);
        if (!visible) closeObstacleDialog(key);
    });
}

function activateObstacle(q, r) {
    if (plantingSeedType) { plantOnTile(q, r); return; }
    const key = getTileKey(q, r);
    const obstacle = tileObstacles.get(key);
    if (!obstacle || !isObstacleVisible(obstacle)) return;
    if (obstacle.key === "river") {
        beginPlanting(normalMode ? selectedSeedType : "maple");
        return;
    }
    if (normalMode && (!boardTileKeys.has(key) || getBoardTileColor(q,r) === "grey")) purchaseTile(q, r);
    else clearTileObstacle(q, r);
}

function clearTileObstacle(q, r) {
    if (!canAct()) return;
    const key = getTileKey(q, r);
    const obstacle = tileObstacles.get(key);
    if (!obstacle || obstacle.key === "river") return false;
    if (normalMode && (!boardTileKeys.has(key) || getBoardTileColor(q, r) !== selectedColor)) return false;
    if (moneyInCents < obstacle.clearCostInCents) return false;

    moneyInCents -= obstacle.clearCostInCents;
    closeObstacleDialog(key);
    obstacle.element.remove();
    tileObstacles.delete(key);

    const { x, y } = getTileCenter(q, r);
    availableTiles.push({ q, r, x, y });
    updateMoneyDisplay();
    saveGame();
    return true;
}

function spawnRandomTileObstacles() {
    if (normalMode) {
        getGreyTileCoordinates().forEach(({ q, r }) => {
            if (Math.random() < tileObstacleChance) addTileObstacle(q, r);
        });
        return;
    }
    if (currentLevel === 1) return;
    if (currentLevel === 2) {
        if (tileObstacles.size > 0 || availableTiles.length === 0) return;
        const { q, r } = availableTiles[Math.floor(Math.random() * availableTiles.length)];
        addTileObstacle(q, r);
        return;
    }
    boardTileCoordinates.forEach(({ q, r }) => {
        if (tileObstacles.has(getTileKey(q, r))) return;
        if (Math.random() < tileObstacleChance) {
            addTileObstacle(q, r);
        }
    });
}

function restoreSavedTileObstacles(obstacles = []) {
    obstacles.forEach(({ q, r, type }) => {
        if (
            !Number.isInteger(q) ||
            !Number.isInteger(r) ||
            (!boardTileKeys.has(getTileKey(q, r)) &&
                !(normalMode && Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= 5))
        ) {
            return;
        }
        addTileObstacle(q, r, type);
    });
}

function addBoardTile(q, r, isPurchased = false, purchasedColor = selectedColor) {
    const key = getTileKey(q, r);
    if (boardTileKeys.has(key)) return false;

    const { x, y } = getTileCenter(q, r);
    const tileRadius = radius - 1.2;
    const points = Array.from({ length: 6 }, (_, index) => {
        const angle = ((index * 60 - 90) * Math.PI) / 180;
        return `${x + tileRadius * Math.cos(angle)},${y + tileRadius * Math.sin(angle)}`;
    }).join(" ");
    const tile = document.createElementNS(svgNamespace, "polygon");

    tile.setAttribute("class", "hex-tile");
    tile.setAttribute("points", points);
    const tileBody = document.createElementNS(svgNamespace, "g");
    tileBody.setAttribute("class", "tile-body");
    const color = tileOwnership.get(key) ?? (isPurchased && normalMode ? purchasedColor ?? "green" : getBoardTileColor(q, r));
    tileBody.setAttribute("data-color", color);
    tileBody.setAttribute("data-points", points);
    tileBody.addEventListener("pointerdown", (event) => pressTile(key, event, tileBody));
    tileBody.addEventListener("lostpointercapture", releasePressedTreeTile);
    const getPlantedSeed = () => plantedSeeds.find((seed) => seed.tile.q === q && seed.tile.r === r);
    tileBody.addEventListener("mouseenter", (event) => {
        const seed = getPlantedSeed();
        if (seed) openSeedDialog(seed, event);
    });
    tileBody.addEventListener("mousemove", (event) => {
        const seed = getPlantedSeed();
        if (seed && selectedSeed === seed) positionHoverDialog(seedDialog, seed.image, event);
    });
    tileBody.addEventListener("mouseleave", () => {
        const seed = getPlantedSeed();
        if (seed) closeSeedDialog(seed);
    });
    tileBody.addEventListener("click", () => {
        if (plantingSeedType) { plantOnTile(q, r); return; }
        const seed = getPlantedSeed();
        if (normalMode && getBoardTileColor(q, r) === "grey") purchaseTile(q, r);
        else if (seed) upgradeSeed(seed);
    });
    tileBody.setAttribute("tabindex", "0");
    tileBody.addEventListener("keydown", event => {
        if (plantingSeedType && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            plantOnTile(q, r);
        }
    });
    tileElements.set(key, tileBody);
    tileBody.append(tile);

    const bevelPoints = (size, yOffset = 0) => Array.from({ length: 6 }, (_, index) => {
        const angle = ((index * 60 - 90) * Math.PI) / 180;
        return `${x + size * Math.cos(angle)},${y + yOffset + size * Math.sin(angle)}`;
    });
    const outerEdge = bevelPoints(tileRadius);
    const topEdge = bevelPoints(radius - 5, -1);
    const palettes = {
        grey: ["#c9cdd1", "#a8adb2", "#7b8289", "#656c73", "#7b8289", "#b7bdc3"],
        green: ["#9ac68a", "#679b60", "#365f38", "#284c30", "#305a37", "#78a76b"],
        yellow: ["#ffe99b", "#e2bd50", "#a88024", "#88651e", "#a07926", "#eed070"],
        red: ["#f7a095", "#d9675e", "#9e3f38", "#7e302e", "#963d36", "#e88276"],
        blue: ["#9dd5f7", "#609fcf", "#356b9d", "#28547f", "#32638f", "#7ab9e2"],
    };
    const edgeColors = palettes[color];
    const bevelElements = [];

    outerEdge.forEach((point, index) => {
        const next = (index + 1) % 6;
        const bevel = document.createElementNS(svgNamespace, "polygon");
        bevel.setAttribute("points", [point, outerEdge[next], topEdge[next], topEdge[index]].join(" "));
        bevel.setAttribute("fill", edgeColors[index]);
        bevel.setAttribute("class", "tile-bevel");
        tileBody.append(bevel);
        bevelElements.push(bevel);
    });
    const surface = document.createElementNS(svgNamespace, "polygon");
    surface.setAttribute("class", "tile-surface");
    surface.setAttribute("points", topEdge.join(" "));
    tileBody.append(surface);
    tileBody.recolor = newColor => {
        tileBody.setAttribute("data-color", newColor);
        bevelElements.forEach((bevel, index) => bevel.setAttribute("fill", palettes[newColor][index]));
    };
    tiles.prepend(tileBody);
    if (!tileObstacles.has(key) || isRiverTile({ q, r })) availableTiles.push({ q, r, x, y });
    boardTileCoordinates.push({ q, r });
    boardTileKeys.add(key);
    if (isPurchased) {
        purchasedTileCoordinates.push({ q, r, ...(normalMode && purchasedColor ? { color: purchasedColor } : {}) });
        updateBoardViewBox();
    }
    return true;
}

function updateBoardViewBox() {
    let minX = 0;
    let minY = 0;
    let maxX = 460;
    let maxY = 410;

    [...boardTileCoordinates, ...(normalMode ? getGreyTileCoordinates() : getPurchaseCandidates())].forEach(({ q, r }) => {
        const { x, y } = getTileCenter(q, r);
        minX = Math.min(minX, x - radius);
        minY = Math.min(minY, y - radius);
        maxX = Math.max(maxX, x + radius);
        maxY = Math.max(maxY, y + radius);
    });

    tiles.ownerSVGElement.setAttribute(
        "viewBox",
        `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
    );
}

function addPlantedSeed(seedData) {
    const tileIndex = availableTiles.findIndex(
        (tile) => Math.abs(tile.x - seedData.x) < 0.001 &&
            Math.abs(tile.y - seedData.y) < 0.001
    );
    if (tileIndex < 0) {
        throw new Error("The save refers to a tile that is not available.");
    }

    const [tile] = availableTiles.splice(tileIndex, 1);
    const image = document.createElementNS(svgNamespace, "image");
    const seedState = { ...seedData, treeType: seedData.treeType ?? "standard", image, tile };

    image.setAttribute("class", "planted-seed");
    image.addEventListener("pointerdown", (event) => {
        pressTile(getTileKey(tile.q, tile.r), event, image);
    });
    image.addEventListener("lostpointercapture", releasePressedTreeTile);
    updateSeedAppearance(seedState);
    image.addEventListener("mouseenter", (event) => openSeedDialog(seedState, event));
    image.addEventListener("mousemove", (event) => {
        if (selectedSeed === seedState) positionHoverDialog(seedDialog, image, event);
    });
    image.addEventListener("mouseleave", () => closeSeedDialog(seedState));
    image.addEventListener("click", () => upgradeSeed(seedState));
    image.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        compostTree(seedState);
    });
    image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            upgradeSeed(seedState);
        }
    });
    tiles.append(image);
    plantedSeeds.push(seedState);
    return seedState;
}

function getCompostReward(seedState) {
    return getGrowthStage(seedState).earningInCents * (seedState.stageIndex + 1);
}

function compostTree(seedState) {
    if (!canAct()) return;
    if (!canManageTree(seedState)) return;
    const index = plantedSeeds.indexOf(seedState);
    if (index < 0) return;

    if (!normalMode && currentLevel === 8 && seedState.stageIndex === maximumGrowthStage) {
        matureTreesComposted += 1;
    }
    const reward = getCompostReward(seedState);
    moneyInCents += reward;
    const bank = document.querySelector(".money-counter");
    const rewardMessage = document.querySelector(".compost-reward");
    bank.setAttribute("data-compost-highlight", "true");
    rewardMessage.textContent = `+${(reward / 100).toFixed(2)} leaves from composting!`;
    rewardMessage.hidden = false;
    const highlightVersion = ++compostHighlightVersion;
    window.setTimeout(() => {
        if (highlightVersion !== compostHighlightVersion) return;
        bank.setAttribute("data-compost-highlight", "false");
        rewardMessage.hidden = true;
        if (startingTileCount === 1 && tutorialCompleted) tutorialCompleteDialog.showModal();
    }, 3500);
    if (startingTileCount === 1 && seedState.stageIndex >= 2) tutorialCompleted = true;
    closeSeedDialog(seedState);
    seedState.image.remove();
    plantedSeeds.splice(index, 1);
    availableTiles.push(seedState.tile);
    if (normalMode) {
        const key = getTileKey(seedState.tile.q, seedState.tile.r);
        tileOwnership.set(key, "grey");
        tileElements.get(key)?.recolor("grey");
    }
    updateMoneyDisplay();
    saveGame();
}

function getSeedUpgradeCost(seedState) {
    return getGrowthStage(seedState).upgradeCostInCents ??
        seedUpgradeCostInCents;
}

function updateSeedAppearance(seedState) {
    seedState.image.setAttribute("data-river-bonus", String(isRiverTile(seedState.tile)));
    const growthProgress = Math.min(1,
        (seedState.stageIndex + seedState.upgradesInStage / getUpgradesPerStage(seedState)) /
        maximumGrowthStage
    );
    const minimumSize = maximumTileImageSize * 0.7;
    const size = minimumSize + (maximumTileImageSize - minimumSize) * growthProgress;
    const stage = getGrowthStage(seedState);

    seedState.image.setAttribute("href", stage.image);
    seedState.image.setAttribute("x", seedState.x - size / 2);
    seedState.image.setAttribute("y", seedState.y - size / 2);
    seedState.image.setAttribute("width", size);
    seedState.image.setAttribute("height", size);
    seedState.image.setAttribute(
        "aria-label",
        seedState.stageIndex === maximumGrowthStage
            ? `Fully grown ${stage.name.toLowerCase()}.`
            : `${stage.name}, ${seedState.upgradesInStage} of ${getUpgradesPerStage(seedState)} upgrades. Click to upgrade.`
    );
    seedState.image.setAttribute("role", "button");
    seedState.image.setAttribute("aria-description", `Right-click to compost for ${seedState.stageIndex + 1} times this stage's earnings per payout.`);
    seedState.image.setAttribute("tabindex", "0");
    seedState.image.classList.add("upgradeable-seed");
}

function updateSeedDialog() {
    if (!selectedSeed) return;

    const stage = getGrowthStage(selectedSeed);
    showLeafAmount(seedCompostInfo, (getCompostReward(selectedSeed) / 100).toFixed(2), "Right-click to compost for ", ` (${selectedSeed.stageIndex + 1}× earnings).`);
    const isFullyGrown = selectedSeed.stageIndex === maximumGrowthStage;
    seedDialogTitle.textContent = stage.name;
    seedPreviewImage.src = stage.image;
    seedPreviewImage.alt = stage.name;
    const earningPerPayout = (getTreeIncome(selectedSeed) / 100).toFixed(2);
    showLeafAmount(seedDescription, earningPerPayout, "Earns ", isFullyGrown
        ? " each time you click Done."
        : " each time you click Done. Click the tree to upgrade.");
    const requiredUpgrades = getUpgradesPerStage(selectedSeed);
    seedProgressBar.max = requiredUpgrades;
    const displayedUpgrades = isFullyGrown
        ? requiredUpgrades
        : selectedSeed.upgradesInStage;
    seedProgressBar.value = displayedUpgrades;
    seedProgressCount.textContent = `${displayedUpgrades}/${requiredUpgrades}`;
    if (isFullyGrown) {
        seedUpgradeCost.textContent = "Grown";
    } else {
        showLeafAmount(seedUpgradeCost, (getSeedUpgradeCost(selectedSeed) / 100).toFixed(2));
    }
}

function openSeedDialog(seedState, event) {
    closeObstacleDialog(selectedObstacle);
    selectedSeed = seedState;
    updateSeedDialog();
    if (!seedDialog.open) {
        seedDialog.show();
    }
    positionHoverDialog(seedDialog, seedState.image, event);
}

function upgradeSeed(seedState) {
    if (plantingSeedType) { plantOnTile(seedState.tile.q, seedState.tile.r); return; }
    if (normalMode && getBoardTileColor(seedState.tile.q, seedState.tile.r) === "grey") {
        purchaseTile(seedState.tile.q, seedState.tile.r);
        return;
    }
    if (!canAct()) return;
    if (!canManageTree(seedState)) return;
    const upgradeCostInCents = getSeedUpgradeCost(seedState);
    if (
        seedState.stageIndex >= maximumGrowthStage ||
        moneyInCents < upgradeCostInCents
    ) {
        return;
    }

    moneyInCents -= upgradeCostInCents;
    advanceSeedGrowth(seedState);
    updateMoneyDisplay();
}

function advanceSeedGrowth(seedState) {
    seedState.upgradesInStage += 1;
    if (seedState.upgradesInStage === getUpgradesPerStage(seedState)) {
        seedState.stageIndex += 1;
        seedState.upgradesInStage = 0;
    }

    updateSeedAppearance(seedState);
    if (selectedSeed === seedState) {
        updateSeedDialog();
    }
    saveGame();
}

function closeSeedDialog(seedState) {
    if (selectedSeed !== seedState) return;
    if (seedDialog.open) {
        seedDialog.close();
    }
    selectedSeed = null;
}

function canManageTree(seed) {
    return !normalMode || (!playerStates.find(player => player.color === selectedColor)?.eliminated && getBoardTileColor(seed.tile.q, seed.tile.r) === selectedColor);
}

function getCurrentPlayerIncome() {
    return plantedSeeds.filter(canManageTree).reduce((total, seed) => total + getTreeIncome(seed), 0);
}

function isRiverTile({ q, r }) {
    return tileObstacles.get(getTileKey(q, r))?.key === "river";
}

function getTreeIncome(seed) {
    return getGrowthStage(seed).earningInCents * (isRiverTile(seed.tile) ? 2 : 1);
}

function syncCurrentPlayer() {
    if (!normalMode) return;
    const player = playerStates.find(player => player.color === selectedColor);
    if (player) {
        player.moneyInCents = moneyInCents;
        player.seedType = selectedSeedType;
    }
}

function initializePlayers() {
    if (!normalMode || !selectedColor || !selectedSeedType) return;
    const colors = activeBoardColors ?? [selectedColor];
    playerStates = ["green", "yellow", "red"].filter(color => colors.includes(color)).map(color => ({
        color,
        seedType: color === selectedColor ? selectedSeedType :
            plantedSeeds.find(seed => getBoardTileColor(seed.tile.q, seed.tile.r) === color)?.treeType ?? "maple",
        moneyInCents: color === selectedColor ? moneyInCents : 1000,
    }));
}

function updateDisasterMeter() {
    document.querySelector(".disaster-meter").hidden = !gameStarted || startingTileCount === 1;
    const track = document.querySelector(".disaster-track");
    track.setAttribute("aria-valuenow", String(disasterTurns));
    track.setAttribute("aria-valuemax", String(disasterTurnLimit));
    track.setAttribute("aria-valuetext", `${disasterTurns} of ${disasterTurnLimit} turns`);
    document.querySelector(".disaster-fill").style.height = `${disasterTurns / disasterTurnLimit * 100}%`;
    const message = document.querySelector(".disaster-message");
    const full = disasterTurns === disasterTurnLimit;
    message.hidden = !full;
    if (message.textContent !== (full ? "natural disaster" : "")) {
        message.textContent = full ? "natural disaster" : "";
    }
}

function collectPayout() {
    if (!canAct()) return;
    if (!gameStarted) return;
    const income = getCurrentPlayerIncome();
    if (!normalMode && income === 0) return;
    if (startingTileCount !== 1 && (!normalMode || selectedColor === humanColor)) {
        disasterTurns = Math.min(disasterTurnLimit, disasterTurns + 1);
    }
    moneyInCents += income;
    payoutStatus.textContent = `Collected ${(income / 100).toFixed(2)} leaves.`;
    if (normalMode) {
        if (playerStates.length === 0) initializePlayers();
        syncCurrentPlayer();
        moveToNextPlayer();
    }
    updateMoneyDisplay();
    saveGame();
    scheduleBotTurn();
}

function gameIsOver() {
    return normalMode && playerStates.some(player => player.eliminated) &&
        playerStates.filter(player => !player.eliminated).length <= 1;
}

function canAct() {
    return !gameIsOver() && !(normalMode && playerStates.find(player => player.color === selectedColor)?.eliminated) &&
        (!isBotTurn() || performingBotAction);
}

function moveToNextPlayer() {
    plantingSeedType = null;
    const colors = ["green", "yellow", "red"];
    for (let offset = 1; offset <= colors.length; offset++) {
        const color = colors[(colors.indexOf(selectedColor) + offset) % colors.length];
        const next = playerStates.find(player => player.color === color && !player.eliminated);
        if (!next) continue;
        closeSeedDialog(selectedSeed);
        closeObstacleDialog(selectedObstacle);
        selectedColor = next.color;
        selectedSeedType = next.seedType;
        moneyInCents = next.moneyInCents;
        payoutStatus.textContent += ` ${color[0].toUpperCase() + color.slice(1)}’s turn.`;
        return;
    }
}

function forfeitPlayer() {
    if (!gameStarted || !normalMode || !canAct()) return;
    const player = playerStates.find(player => player.color === selectedColor);
    if (!player || player.eliminated) return;
    syncCurrentPlayer();
    const abandoned = boardTileCoordinates.filter(({q,r}) => getBoardTileColor(q,r) === player.color);
    player.eliminated = true;
    abandoned.forEach(({q,r}) => {
        const key = getTileKey(q,r);
        tileOwnership.set(key, "grey");
        tileElements.get(key)?.recolor("grey");
    });
    botTurnVersion += 1;
    closeSeedDialog(selectedSeed);
    closeObstacleDialog(selectedObstacle);
    payoutStatus.textContent = `${player.color[0].toUpperCase() + player.color.slice(1)} forfeited.`;
    moveToNextPlayer();
    updateMoneyDisplay();
    saveGame();
    scheduleBotTurn();
}

forfeitButton.addEventListener("click", forfeitPlayer);

// Keep ownership separate from the active turn, including across reloads.
function isBotTurn() {
    return normalMode && humanColor !== null && selectedColor !== humanColor;
}

function scheduleBotTurn() {
    const version = ++botTurnVersion;
    if (!gameStarted || !isBotTurn() || gameIsOver()) return;
    let actions = 0;
    let planted = false;
    let composted = false;
    let expanded = false;
    const step = () => {
        if (version !== botTurnVersion || !gameStarted || !isBotTurn() || gameIsOver()) return;
        performingBotAction = true;
        try {
            const trees = plantedSeeds.filter(canManageTree);
            const mature = trees.filter(seed => seed.stageIndex === maximumGrowthStage);
            const plantingCost = selectedSeedType === "oak" ? oakSeedCostInCents : seedCostInCents;
            const upgrade = trees.filter(seed => seed.stageIndex < maximumGrowthStage && getSeedUpgradeCost(seed) <= moneyInCents)
                .sort((a, b) => getSeedUpgradeCost(a) - getSeedUpgradeCost(b) || b.upgradesInStage - a.upgradesInStage)[0];
            const needsSpace = getPlantingTargets().length === 0;
            const obstacle = Array.from(tileObstacles.values())
                .filter(({ q, r, clearCostInCents, key }) => key !== "river" && boardTileKeys.has(getTileKey(q, r)) &&
                    getBoardTileColor(q, r) === selectedColor && moneyInCents >= clearCostInCents + plantingCost)
                .sort((a, b) => a.clearCostInCents - b.clearCostInCents)[0];
            const expansion = getPurchaseCandidates(selectedColor)
                .map(tile => {
                    const obstacle = tileObstacles.get(getTileKey(tile.q, tile.r));
                    const existingTree = plantedSeeds.some(seed => seed.tile.q === tile.q && seed.tile.r === tile.r);
                    return { ...tile, clearCost: obstacle?.treeType ? 0 : obstacle?.clearCostInCents ?? 0,
                        plantingCost: obstacle?.treeType || existingTree ? 0 : plantingCost };
                })
                .filter(tile => moneyInCents >= tileCostInCents + tile.clearCost + tile.plantingCost)
                .sort((a, b) => a.clearCost - b.clearCost)[0];
            const name = selectedColor[0].toUpperCase() + selectedColor.slice(1);
            if (getCurrentPlayerIncome() === 0 && !obstacle && !expansion &&
                (needsSpace || moneyInCents < plantingCost)) {
                forfeitPlayer();
                return;
            }
            if (actions >= 8) {
                collectPayout();
                return;
            } else if (needsSpace && obstacle) {
                clearTileObstacle(obstacle.q, obstacle.r);
                payoutStatus.textContent = `${name} bot cleared an obstacle.`;
            } else if (needsSpace && !expanded && expansion) {
                purchaseTile(expansion.q, expansion.r);
                expanded = true;
                payoutStatus.textContent = `${name} bot bought a tile.`;
            } else if (!composted && needsSpace && mature.length > 1) {
                compostTree(mature[0]);
                composted = true;
                payoutStatus.textContent = `${name} bot composted a mature tree.`;
            } else if (!planted && getPlantingTargets().length > 0 && moneyInCents >= plantingCost) {
                const targets = getPlantingTargets();
                plantSeed(selectedSeedType, targets[Math.floor(Math.random() * targets.length)]);
                planted = true;
                payoutStatus.textContent = `${name} bot planted a tree.`;
            } else if (upgrade) {
                upgradeSeed(upgrade);
                payoutStatus.textContent = `${name} bot upgraded a tree.`;
            } else {
                collectPayout();
                return;
            }
            actions += 1;
        } finally {
            performingBotAction = false;
        }
        window.setTimeout(step, 350);
    };
    window.setTimeout(step, 500);
}

doneButton.addEventListener("click", collectPayout);

function startGame() {
    gameStarted = true;
    updateMoneyDisplay();
    saveSlotDialog.close();
    if (startingTileCount === 1 && tutorialCompleted) tutorialCompleteDialog.showModal();
    if (startingTileCount === 1 && !tutorialCompleted && plantedSeeds.length === 0) {
        tutorialPromptReady = false;
        updateMoneyDisplay();
        tutorialWelcomeDialog.showModal();
    }
    saveGame();
    scheduleBotTurn();
}

document.querySelector(".tutorial-complete-next").addEventListener("click", () => {
    tutorialCompleteDialog.close();
});
tutorialCompleteDialog.addEventListener("close", () => {
    if (startingTileCount !== 1 || !tutorialCompleted) return;
    currentLevel = 1;
    startingTileCount = 7;
    boardLayoutVersion = 2;
    levelOneCompleted = false;
    levelTwoCompleted = false;
    matureTreesComposted = 0;
    completedLevels.clear();
    resetBoard();
    spawnRandomTileObstacles();
    updateMoneyDisplay();
    saveGame();
});

document.querySelector(".tutorial-welcome-dismiss").addEventListener("click", () => {
    tutorialWelcomeDialog.close();
});
tutorialWelcomeDialog.addEventListener("close", () => {
    window.setTimeout(() => {
        if (startingTileCount !== 1 || tutorialCompleted) return;
        document.querySelector(".tutorial-done-prompt").hidden = false;
        payoutControls.setAttribute("data-tutorial-focus", "true");
        document.querySelector(".tutorial-done-next").focus();
    }, 700);
});
document.querySelector(".tutorial-done-next").addEventListener("click", () => {
    document.querySelector(".tutorial-done-prompt").hidden = true;
    payoutControls.setAttribute("data-tutorial-focus", "false");
    plantMapleButton.focus();
    window.setTimeout(() => {
        tutorialPromptReady = true;
        updateMoneyDisplay();
    }, 700);
});

function continueGame() {
    if (!savedGameData || !isValidSaveData(savedGameData)) return;

    normalMode = savedGameData.normalMode ?? getSavedStartingTileCount(savedGameData) !== 1;
    naturalExpansion = savedGameData.naturalExpansion === true;
    disasterTurns = Number.isInteger(savedGameData.disasterTurns)
        ? Math.max(0, Math.min(disasterTurnLimit, savedGameData.disasterTurns)) : 0;
    playerStates = (savedGameData.playerStates ?? []).map(player => ({ ...player }));
    tileOwnership = new Map((savedGameData.tileOwnership ?? []).map(({key, color}) => [key, color]));
    selectedSeedType = savedGameData.selectedSeedType ?? null;
    selectedColor = savedGameData.selectedColor ?? null;
    humanColor = savedGameData.humanColor ?? selectedColor;
    activeBoardColors = savedGameData.activeBoardColors ?? null;
    playerCount = activeBoardColors?.length ?? 3;
    moneyInCents = savedGameData.moneyInCents;
    tutorialCompleted = savedGameData.tutorialCompleted === true;
    currentLevel = savedGameData.currentLevel ?? 1;
    // Preserve the layout of existing saves, including older full hexagon boards.
    startingTileCount = getSavedStartingTileCount(savedGameData);
    boardLayoutVersion = savedGameData.boardLayoutVersion ?? 1;
    resetBoard();
    levelOneCompleted = savedGameData.levelOneCompleted ?? false;
    levelTwoCompleted = savedGameData.levelTwoCompleted ?? false;
    matureTreesComposted = savedGameData.matureTreesComposted ?? 0;
    completedLevels.clear();
    for (let level = 1; level < currentLevel; level += 1) completedLevels.add(level);
    (savedGameData.completedLevels ?? []).forEach((level) => completedLevels.add(level));
    (savedGameData.additionalTiles ?? []).forEach(({ q, r, color }) => {
        addBoardTile(q, r, true, color ?? selectedColor);
    });
    restoreSavedTileObstacles(savedGameData.obstacles ?? []);
    savedGameData.seeds.forEach(addPlantedSeed);
    if (normalMode) [...tileObstacles.values()].forEach(({q, r}) => claimTreeObstacle(q, r));
    if (normalMode && !savedGameData.greyObstaclesGenerated) spawnRandomTileObstacles();
    if (playerStates.length === 0) initializePlayers();
    updateMoneyDisplay();
    if (normalMode && (!selectedColor || !selectedSeedType)) {
        openPlayerSetup(true);
        return;
    }
    startGame();
}

function startNewGame(withTutorial = false, color = null, withLevels = false, seedType = null, withNaturalExpansion = false) {
    if (!withTutorial && !withLevels &&
        (!["red", "green", "yellow"].includes(color) || !["maple", "birch", "spruce", "oak"].includes(seedType))) {
        pendingNaturalExpansion = withNaturalExpansion;
        openPlayerSetup(false);
        return;
    }

    try {
        localStorage.removeItem(saveStorageKey);
    } catch (error) {
        saveStatus.textContent = "Unable to clear the previous save.";
        console.error("Could not clear previous saved game.", error);
    }

    savedGameData = null;
    disasterTurns = 0;
    playerStates = [];
    tileOwnership.clear();
    normalMode = !withTutorial && !withLevels;
    naturalExpansion = normalMode && withNaturalExpansion;
    selectedSeedType = normalMode ? seedType : null;
    if (tutorialWelcomeDialog.open) tutorialWelcomeDialog.close();
    document.querySelector(".tutorial-done-prompt").hidden = true;
    payoutControls.setAttribute("data-tutorial-focus", "false");
    selectedColor = normalMode ? color : null;
    humanColor = selectedColor;
    activeBoardColors = normalMode ? choosePlayerColors(color, playerCount) : null;
    tutorialCompleted = false;
    currentLevel = 1;
    startingTileCount = withTutorial ? 1 : withLevels ? 7 : naturalExpansion ? 91 : 1 + 7 * activeBoardColors.length;
    boardLayoutVersion = 2;
    resetBoard();
    if (normalMode) {
        plantStartingSprouts();
        spawnStartingRiver();
        initializePlayers();
    }
    levelOneCompleted = false;
    levelTwoCompleted = false;
    matureTreesComposted = 0;
    completedLevels.clear();
    hasStoredSave = false;
    moneyInCents = moneyInCents;
    if (!withTutorial) {
        spawnRandomTileObstacles();
    }
    updateMoneyDisplay();
    startGame();
}

function choosePlayerColors(playerColor, count) {
    const remainingColors = ["green", "yellow", "red"].filter(color => color !== playerColor);
    for (let index = remainingColors.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [remainingColors[index], remainingColors[randomIndex]] = [remainingColors[randomIndex], remainingColors[index]];
    }
    return [playerColor, ...remainingColors].slice(0, count);
}

function spawnStartingRiver() {
    const sprout = plantedSeeds.find(seed => getBoardTileColor(seed.tile.q, seed.tile.r) === humanColor);
    if (!sprout) return;
    const greyTiles = getGreyTileCoordinates();
    const neighbor = greyTiles.find(({ q, r }) => tileNeighborOffsets.some(([dq, dr]) =>
        q === sprout.tile.q + dq && r === sprout.tile.r + dr));
    if (neighbor) addTileObstacle(neighbor.q, neighbor.r, "river");
}

function plantStartingSprouts() {
    const seedTypes = ["maple", "birch", "spruce", "oak"];
    for (const color of activeBoardColors) {
        const region = availableTiles.filter(({ q, r }) => getBoardTileColor(q, r) === color);
        const distanceSquared = ({ x, y }) => (x - centerX) ** 2 + (y - centerY) ** 2;
        const farthestTile = region.reduce((farthest, tile) =>
            !farthest || distanceSquared(tile) > distanceSquared(farthest) ? tile : farthest, null);
        if (!farthestTile) continue;
        addPlantedSeed({
            treeType: color === selectedColor ? selectedSeedType : seedTypes[Math.floor(Math.random() * seedTypes.length)],
            x: farthestTile.x,
            y: farthestTile.y,
            stageIndex: 2,
            upgradesInStage: 0,
        });
    }
}

function updateSetupPreview() {
    setupPreview.setAttribute("data-color", pendingColor ?? "none");
    setupPreview.setAttribute("aria-label", pendingColor
        ? `${pendingColor} circle${pendingSeedType ? ` with ${pendingSeedType} seed` : ""}`
        : "Choose a color and seed");
    setupPreviewSeed.hidden = !pendingColor || !pendingSeedType;
    if (pendingSeedType) {
        setupPreviewSeed.src = `images/${pendingSeedType}/seed.png`;
        setupPreviewSeed.alt = `${pendingSeedType} seed`;
    }
    setupDoneButton.disabled = !pendingColor || !pendingSeedType;
    for (const color of ["red", "green", "yellow"]) {
        const button = document.querySelector(`.choose-${color}`);
        button.setAttribute("aria-pressed", String(color === pendingColor));
        button.disabled = choosingColorForContinue && activeBoardColors !== null && !activeBoardColors.includes(color);
    }
    for (const type of ["maple", "birch", "spruce", "oak"]) {
        document.querySelector(`.choose-seed-${type}`).setAttribute("aria-pressed", String(type === pendingSeedType));
    }
}

function openPlayerSetup(resuming) {
    choosingColorForContinue = resuming;
    pendingColor = resuming ? selectedColor : null;
    pendingSeedType = resuming ? selectedSeedType : null;
    playerCountSlider.disabled = resuming;
    if (resuming) playerCountSlider.value = String(playerCount);
    updatePlayerCount();
    updateSetupPreview();
    colorDialog.showModal();
}

for (const color of ["red", "green", "yellow"]) {
    document.querySelector(`.choose-${color}`).addEventListener("click", () => {
        if (choosingColorForContinue && activeBoardColors && !activeBoardColors.includes(color)) return;
        pendingColor = color;
        updateSetupPreview();
    });
}

for (const seedType of ["maple", "birch", "spruce", "oak"]) {
    document.querySelector(`.choose-seed-${seedType}`).addEventListener("click", () => {
        pendingSeedType = seedType;
        updateSetupPreview();
    });
}

setupDoneButton.addEventListener("click", () => {
    if (!pendingColor || !pendingSeedType) return;
    colorDialog.close();
    if (choosingColorForContinue) {
        selectedColor = pendingColor;
        humanColor = pendingColor;
        selectedSeedType = pendingSeedType;
        if (playerStates.length === 0) initializePlayers();
        tileElements.forEach((tile, key) => {
            const [q, r] = key.split(",").map(Number);
            tile.setAttribute("data-color", getBoardTileColor(q, r));
        });
        startGame();
    } else {
        startNewGame(false, pendingColor, false, pendingSeedType, pendingNaturalExpansion);
    }
});

continueGameButton.addEventListener("click", continueGame);
nextLevelButton.addEventListener("click", advanceToNextLevel);
newGameButton.addEventListener("click", () => startNewGame());
tutorialButton.addEventListener("click", () => startNewGame(true));
window.addEventListener("beforeunload", saveGame);

function plantSeed(treeType = normalMode ? selectedSeedType : "maple", target = null) {
    if (!canAct()) return;
    if (normalMode && treeType !== selectedSeedType) return;
    if (!["maple", "birch", "spruce", "oak"].includes(treeType)) return;
    const plantingCost = treeType === "oak" ? oakSeedCostInCents : seedCostInCents;
    const plantableTiles = target ? getPlantingTargets().filter(tile => tile.q === target.q && tile.r === target.r) : getPlantableTiles();
    if (moneyInCents < plantingCost || plantableTiles.length === 0) return false;

    const { q, r, x, y } = plantableTiles[Math.floor(Math.random() * plantableTiles.length)];
    if (normalMode && (!boardTileKeys.has(getTileKey(q,r)) || getBoardTileColor(q,r) === "grey")) {
        if (boardTileKeys.has(getTileKey(q,r))) {
            tileOwnership.set(getTileKey(q,r), selectedColor);
            tileElements.get(getTileKey(q,r))?.recolor(selectedColor);
        } else {
            addBoardTile(q, r, true);
        }
    }
    addPlantedSeed({
        treeType,
        x,
        y,
        stageIndex: 0,
        upgradesInStage: 0,
    });
    moneyInCents -= plantingCost;
    updateMoneyDisplay();
    saveGame();
}

function getPlantingTargets() {
    const owned = getPlantableTiles();
    if (!normalMode) return owned;
    const grey = getGreyTileCoordinates().filter(({ q, r }) =>
        tileNeighborOffsets.some(([dq, dr]) => boardTileKeys.has(getTileKey(q + dq, r + dr)) &&
            getBoardTileColor(q + dq, r + dr) === selectedColor) &&
        (!tileObstacles.has(getTileKey(q,r)) || isRiverTile({ q, r })) &&
        !plantedSeeds.some(seed => seed.tile.q === q && seed.tile.r === r)
    ).map(({q,r}) => ({q,r,...getTileCenter(q,r)}));
    return [...owned, ...grey];
}

function beginPlanting(treeType) {
    if (!gameStarted || !canAct() || (normalMode && treeType !== selectedSeedType)) return;
    const cost = treeType === "oak" ? oakSeedCostInCents : seedCostInCents;
    if (moneyInCents < cost || getPlantingTargets().length === 0) return;
    plantingSeedType = treeType;
    payoutStatus.textContent = "Choose a highlighted empty tile to plant. Adjacent grey tiles become yours. Press Escape to cancel.";
    updateMoneyDisplay();
}

function plantOnTile(q, r) {
    if (!plantingSeedType || !canAct()) return;
    if (!getPlantingTargets().some(tile => tile.q === q && tile.r === r)) {
        payoutStatus.textContent = "Choose an empty owned tile or an empty grey tile next to your territory.";
        return;
    }
    const type = plantingSeedType;
    const cost = type === "oak" ? oakSeedCostInCents : seedCostInCents;
    if (moneyInCents < cost) {
        payoutStatus.textContent = "Not enough leaves to plant. Press Escape to cancel.";
        return;
    }
    plantSeed(type, {q,r});
    payoutStatus.textContent = "Seed planted. Choose another tile, or press Escape to cancel.";
}

function updatePlantingHighlights() {
    const targets = new Set(plantingSeedType ? getPlantingTargets().map(({q,r}) => getTileKey(q,r)) : []);
    [tileElements, purchaseTileElements].forEach(elements => elements.forEach((element, key) => {
        element.setAttribute("data-plantable", String(targets.has(key)));
    }));
    for (const [type, button] of [["maple", plantMapleButton], ["birch", plantBirchButton], ["spruce", plantSpruceButton], ["oak", plantOakButton]]) {
        button.setAttribute("aria-pressed", String(type === plantingSeedType));
    }
}

window.addEventListener("keydown", event => {
    if (event.key === "Escape" && plantingSeedType) {
        plantingSeedType = null;
        payoutStatus.textContent = "Planting cancelled.";
        updateMoneyDisplay();
    }
});

plantMapleButton.addEventListener("click", () => beginPlanting("maple"));
plantBirchButton.addEventListener("click", () => beginPlanting("birch"));
plantSpruceButton.addEventListener("click", () => beginPlanting("spruce"));
plantOakButton.addEventListener("click", () => beginPlanting("oak"));

// Six tiles along an edge means five steps from the center (91 spaces).
function getGreyTileCoordinates() {
    const coordinates = [];
    for (let q = -5; q <= 5; q += 1) {
        for (let r = -5; r <= 5; r += 1) {
            if (Math.abs(q + r) <= 5 && (!boardTileKeys.has(getTileKey(q, r)) || getBoardTileColor(q,r) === "grey")) {
                coordinates.push({ q, r });
            }
        }
    }
    return coordinates;
}

function getPurchaseCandidates(owner = humanColor ?? selectedColor) {
    if (startingTileCount === 1) return [];
    if (normalMode) return getGreyTileCoordinates().filter(tile => !isRiverTile(tile));
    const candidates = new Map();
    boardTileCoordinates.forEach(({ q, r }) => {
        if (normalMode && getBoardTileColor(q, r) !== owner) return;
        tileNeighborOffsets.forEach(([dq, dr]) => {
            const candidate = { q: q + dq, r: r + dr };
            const key = getTileKey(candidate.q, candidate.r);
            const insideBoard = !normalMode || Math.max(Math.abs(candidate.q), Math.abs(candidate.r), Math.abs(candidate.q + candidate.r)) <= 5;
            if (insideBoard && !boardTileKeys.has(key)) candidates.set(key, candidate);
        });
    });
    return Array.from(candidates.values());
}

function updatePurchaseTiles() {
    updateObstacleVisibility();
    purchaseTileElements.forEach(element => element.remove());
    purchaseTileElements.clear();
    if (gameStarted && normalMode) {
        const disabled = !canAct() || isBotTurn() || moneyInCents < tileCostInCents;
        const purchasableKeys = new Set(getPurchaseCandidates().map(({ q, r }) => getTileKey(q, r)));
        getGreyTileCoordinates().forEach(({ q, r }) => {
            const adjacent = purchasableKeys.has(getTileKey(q, r));
            const { x, y } = getTileCenter(q, r);
            const tile = document.createElementNS(svgNamespace, "polygon");
            tile.setAttribute("class", "purchase-tile");
            tile.setAttribute("points", Array.from({ length: 6 }, (_, index) => {
                const angle = ((index * 60 - 90) * Math.PI) / 180;
                return `${x + (radius - 1.2) * Math.cos(angle)},${y + (radius - 1.2) * Math.sin(angle)}`;
            }).join(" "));
            tile.setAttribute("role", "button");
            tile.setAttribute("tabindex", "0");
            const canPlant = plantingSeedType && getPlantingTargets().some(tile => tile.q === q && tile.r === r);
            const river = isRiverTile({ q, r });
            const label = river ? "Plant a seed on this river for double sun; no tile purchase needed" : plantingSeedType ? "Plant a seed here to claim this tile" : "Choose Plant Seed to claim adjacent empty tiles, or buy this hex for 25 leaves";
            tile.setAttribute("aria-label", label);
            const riverUnavailable = !canAct() || isBotTurn() ||
                moneyInCents < (selectedSeedType === "oak" ? oakSeedCostInCents : seedCostInCents) ||
                !getPlantingTargets().some(tile => tile.q === q && tile.r === r);
            tile.setAttribute("aria-disabled", String(plantingSeedType ? !canPlant || !canAct() : river ? riverUnavailable : disabled || !adjacent));
            const title = document.createElementNS(svgNamespace, "title");
            title.textContent = label;
            tile.append(title);
            tile.addEventListener("click", () => plantingSeedType ? plantOnTile(q, r) : river ? activateObstacle(q, r) : purchaseTile(q, r));
            tile.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (plantingSeedType) plantOnTile(q, r);
                    else if (river) activateObstacle(q, r);
                    else purchaseTile(q, r);
                }
            });
            purchaseTileElements.set(getTileKey(q, r), tile);
            tiles.prepend(tile);
        });
    }
    updateBoardViewBox();
}

function claimTreeObstacle(q, r) {
    const key = getTileKey(q, r);
    const obstacle = tileObstacles.get(key);
    if (!obstacle?.treeType || !boardTileKeys.has(key) || getBoardTileColor(q,r) === "grey") return;
    closeObstacleDialog(key);
    obstacle.element.remove();
    tileObstacles.delete(key);
    const { x, y } = getTileCenter(q, r);
    availableTiles.push({ q, r, x, y });
    addPlantedSeed({ treeType: obstacle.treeType, stageIndex: obstacle.stageIndex, upgradesInStage: 0, x, y });
}

function purchaseTile(q, r) {
    if (!gameStarted || !canAct() || moneyInCents < tileCostInCents) return;
    if (!getPurchaseCandidates(selectedColor).some(tile => tile.q === q && tile.r === r)) return;
    const key = getTileKey(q,r);
    if (boardTileKeys.has(key)) {
        if (getBoardTileColor(q,r) !== "grey") return;
        tileOwnership.set(key, selectedColor);
        tileElements.get(key)?.recolor(selectedColor);
    } else if (!addBoardTile(q, r, true)) return;
    closeObstacleDialog(getTileKey(q, r));
    if (!normalMode && currentLevel > 2 && Math.random() < tileObstacleChance) {
        addTileObstacle(q, r);
    }
    if (normalMode) claimTreeObstacle(q, r);
    moneyInCents -= tileCostInCents;
    updateMoneyDisplay();
    saveGame();
}

buyTileButton.addEventListener("click", () => {
    const candidates = getPurchaseCandidates();
    if (candidates.length === 0) return;
    const { q, r } = candidates[Math.floor(Math.random() * candidates.length)];
    purchaseTile(q, r);
});

function getSavedStartingTileCount(data) {
    if (data.boardTileCount !== undefined) return data.boardTileCount;
    const length = data.boardSideLength ?? 6;
    return 1 + 3 * length * (length - 1);
}

function getNaturalExpansionCoordinates(colors) {
    const positions = colors.length === 2 ? [[5, -2], [-5, 2]] : [[5, -2], [-3, 5], [-2, -3]];
    return colors.map((color, index) => ({ q: positions[index][0], r: positions[index][1], color }));
}

function getNormalBoardCoordinates(colors = activeBoardColors, expansion = naturalExpansion) {
    if (expansion && colors) return getNaturalExpansionCoordinates(colors);
    const coordinates = [{ q: 0, r: 0, color: "blue" }];
    for (const [q, r, color] of [[1, -2, "green"], [1, 1, "yellow"], [-2, 1, "red"]]) {
        if (colors && !colors.includes(color)) continue;
        coordinates.push({ q, r, color });
        tileNeighborOffsets.forEach(([dq, dr]) => coordinates.push({ q: q + dq, r: r + dr, color }));
    }
    return coordinates;
}

function getBoardTileColor(q, r) {
    if (normalMode && tileOwnership.has(getTileKey(q, r))) return tileOwnership.get(getTileKey(q, r));
    const purchased = purchasedTileCoordinates.find(tile => tile.q === q && tile.r === r);
    if (purchased?.color) return purchased.color;
    if (!activeBoardColors && startingTileCount !== 22) return selectedColor ?? "green";
    return getNormalBoardCoordinates().find(tile => tile.q === q && tile.r === r)?.color ?? selectedColor ?? "green";
}

function getStartingCoordinates(count, layoutVersion = boardLayoutVersion, colors = activeBoardColors, expansion = naturalExpansion) {
    if (colors || count === 22) return getNormalBoardCoordinates(colors, expansion).map(({ q, r }) => ({ q, r }));
    let extent = 0;
    while (1 + 3 * extent * (extent + 1) < count) extent += 1;
    const coordinates = [];
    for (let q = -extent; q <= extent; q += 1) {
        for (let r = -extent; r <= extent; r += 1) {
            if (Math.abs(q + r) > extent) continue;
            coordinates.push({ q, r });
        }
    }
    // Fill from the center outward so partial outer rings remain connected.
    coordinates.sort((a, b) => {
        const ringA = Math.max(Math.abs(a.q), Math.abs(a.r), Math.abs(a.q + a.r));
        const ringB = Math.max(Math.abs(b.q), Math.abs(b.r), Math.abs(b.q + b.r));
        return ringA - ringB ||
            Math.atan2(a.r * 1.5, Math.sqrt(3) * (a.q + a.r / 2)) -
            Math.atan2(b.r * 1.5, Math.sqrt(3) * (b.q + b.r / 2));
    });
    if (layoutVersion === 1) return coordinates.slice(0, count);

    const inner = coordinates.filter(({ q, r }) =>
        Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) < extent);
    const outer = coordinates.slice(inner.length);
    const remaining = count - inner.length;
    // Spread a partial ring around all six sides instead of filling one side first.
    for (let index = 0; index < remaining; index += 1) {
        inner.push(outer[Math.floor(index * outer.length / remaining)]);
    }
    return inner;
}

function createStartingBoard() {
    getStartingCoordinates(startingTileCount).forEach(({ q, r }) => addBoardTile(q, r));
}

createStartingBoard();
updateLevelProgress();
readSavedGame();
if (savedGameData) {
    continueGame();
} else {
    setGameMenuOpen(true);
}
