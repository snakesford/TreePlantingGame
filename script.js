const tiles = document.querySelector(".hex-tiles");
const tileElements = new Map();
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
let pendingColor = null;
let selectedColor = null;
let playerStates = [];
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
const tileObstacleDefinitions = [
    { key: "rock", image: "images/rock.png", clearCostInCents: 1000, label: "rock" },
    { key: "boulder", image: "images/boulder.png", clearCostInCents: 3000, label: "boulder" },
    { key: "burnt-tree", image: "images/burnt-tree.png", clearCostInCents: 2500, label: "burnt tree" },
];
const tileObstacleChance = 0.2;
let selectedSeed = null;
let savedGameData = null;
let hasStoredSave = false;

function showLeafAmount(element, amount, prefix = "", suffix = "") {
    const icon = document.createElement("img");
    icon.className = "currency-icon";
    icon.src = "images/leaf.png";
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
        activeBoardColors,
        playerStates,
        currentLevel,
        boardTileCount: startingTileCount,
        boardLayoutVersion,
        levelOneCompleted,
        levelTwoCompleted,
        completedLevels: Array.from(completedLevels),
        matureTreesComposted,
        moneyInCents,
        additionalTiles: purchasedTileCoordinates.map(({ q, r, color }) => ({ q, r, color })),
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
            data.boardTileCount !== 1 + 7 * data.activeBoardColors.length)) ||
        (data.humanColor != null && (!["red", "green", "yellow"].includes(data.humanColor) ||
            !(data.activeBoardColors ?? [data.selectedColor]).includes(data.humanColor))) ||
        (data.selectedSeedType != null && !["maple", "birch", "spruce", "oak"].includes(data.selectedSeedType)) ||
        (data.normalMode !== undefined && typeof data.normalMode !== "boolean") ||
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
            !["maple", "birch", "spruce", "oak"].includes(player.seedType) ||
            !Number.isFinite(player.moneyInCents) || player.moneyInCents < 0) ||
        (data.playerStates.length > 0 && (!(data.activeBoardColors ?? [data.selectedColor]).every(color => data.playerStates.some(player => player.color === color)) ||
            !data.playerStates.some(player => player.color === data.selectedColor))))) return false;

    const obstacleTypes = new Set(
        tileObstacleDefinitions.map((obstacle) => obstacle.key)
    );
    const additionalTiles = data.additionalTiles ?? [];
    const obstacleTiles = data.obstacles ?? [];
    const startingTiles = getStartingCoordinates(getSavedStartingTileCount(data), data.boardLayoutVersion ?? 1, data.activeBoardColors ?? null);
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
            !tileNeighborOffsets.some(([qOffset, rOffset]) =>
                knownTileKeys.has(`${tile.q + qOffset},${tile.r + rOffset}`)
            )
        ) {
            return false;
        }

        knownTileKeys.add(key);
        tilePositions.push(getTileCenter(tile.q, tile.r));
    }

    for (const obstacle of obstacleTiles) {
        if (
            !obstacle ||
            !Number.isInteger(obstacle.q) ||
            !Number.isInteger(obstacle.r) ||
            !obstacleTypes.has(obstacle.type) ||
            !knownTileKeys.has(`${obstacle.q},${obstacle.r}`)
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
    updateLevelProgress();
    const tutorialActive = startingTileCount === 1;
    plantMapleButton.hidden = false;
    document.querySelector(".game-actions .tutorial-plant-prompt").hidden = tutorialCompleted || !tutorialActive || !tutorialPromptReady || plantedSeeds.length > 0;
    updateTutorialUpgradePrompt();
    [plantBirchButton, plantSpruceButton, plantOakButton, buyTileButton].forEach((button) => {
        button.hidden = tutorialActive;
    });
    if (normalMode) {
        for (const [type, button] of [["maple", plantMapleButton], ["birch", plantBirchButton], ["spruce", plantSpruceButton], ["oak", plantOakButton]]) {
            button.hidden = type !== selectedSeedType;
        }
    }
    const displayedBalance = isBotTurn()
        ? playerStates.find(player => player.color === humanColor)?.moneyInCents ?? 0
        : moneyInCents;
    moneyAmount.textContent = (displayedBalance / 100).toString();
    const noPlantableTiles = getPlantableTiles().length === 0;
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
    turnIndicator.setAttribute("data-color", selectedColor ?? "");
    payoutAmount.textContent = `${(income / 100).toFixed(2)} leaves per click`;
    doneButton.setAttribute("aria-label", `Done: collect ${(income / 100).toFixed(2)} leaves`);
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
    const income = plantedSeeds.reduce((total, seed) => total + getGrowthStage(seed).earningInCents, 0);
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
    botTurnVersion += 1;
    closeSeedDialog(selectedSeed);
    closeObstacleDialog(selectedObstacle);
    tiles.replaceChildren();
    releasePressedTreeTile();
    tileElements.clear();
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
    if (!obstacle) return;
    closeSeedDialog(selectedSeed);
    selectedObstacle = key;
    const name = obstacle.label.charAt(0).toUpperCase() + obstacle.label.slice(1);
    obstacleDialogTitle.textContent = name;
    obstaclePreviewImage.src = obstacle.image;
    obstaclePreviewImage.alt = name;
    showLeafAmount(obstacleDescription, (obstacle.clearCostInCents / 100).toFixed(2), "Click to remove for ", ".");
    if (!obstacleDialog.open) obstacleDialog.show();
    positionHoverDialog(obstacleDialog, obstacle.element, event);
}

function closeObstacleDialog(key) {
    if (selectedObstacle !== key) return;
    if (obstacleDialog.open) obstacleDialog.close();
    selectedObstacle = null;
}

function addTileObstacle(q, r, obstacleType = null) {
    if (normalMode || currentLevel === 1) return false;
    const key = getTileKey(q, r);
    if (tileObstacles.has(key)) return false;

    const definition = obstacleType
        ? tileObstacleDefinitions.find((tileObstacle) => tileObstacle.key === obstacleType)
        : tileObstacleDefinitions[Math.floor(Math.random() * tileObstacleDefinitions.length)];

    if (!definition) return false;

    const { x, y } = getTileCenter(q, r);
    const obstacleImage = document.createElementNS(svgNamespace, "image");
    const obstacleSize = definition.key === "boulder" ? 40 :
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
        clearTileObstacle(q, r);
    });
    obstacleImage.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            clearTileObstacle(q, r);
        }
    });
    tiles.append(obstacleImage);

    tileObstacles.set(key, { ...definition, q, r, element: obstacleImage });
    const availableTileIndex = availableTiles.findIndex(
        (tile) => Math.abs(tile.x - x) < 0.001 && Math.abs(tile.y - y) < 0.001
    );
    if (availableTileIndex >= 0) {
        availableTiles.splice(availableTileIndex, 1);
    }
    return true;
}

function clearTileObstacle(q, r) {
    if (isBotTurn() && !performingBotAction) return;
    const key = getTileKey(q, r);
    const obstacle = tileObstacles.get(key);
    if (!obstacle) return false;
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
    if (normalMode || currentLevel === 1) return;
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
            !boardTileKeys.has(getTileKey(q, r))
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
    const color = isPurchased && normalMode ? purchasedColor ?? "green" : getBoardTileColor(q, r);
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
        const seed = getPlantedSeed();
        if (seed) upgradeSeed(seed);
    });
    tileElements.set(key, tileBody);
    tileBody.append(tile);

    const bevelPoints = (size, yOffset = 0) => Array.from({ length: 6 }, (_, index) => {
        const angle = ((index * 60 - 90) * Math.PI) / 180;
        return `${x + size * Math.cos(angle)},${y + yOffset + size * Math.sin(angle)}`;
    });
    const outerEdge = bevelPoints(tileRadius);
    const topEdge = bevelPoints(radius - 5, -1);
    const edgeColors = {
        green: ["#9ac68a", "#679b60", "#365f38", "#284c30", "#305a37", "#78a76b"],
        yellow: ["#ffe99b", "#e2bd50", "#a88024", "#88651e", "#a07926", "#eed070"],
        red: ["#f7a095", "#d9675e", "#9e3f38", "#7e302e", "#963d36", "#e88276"],
        blue: ["#9dd5f7", "#609fcf", "#356b9d", "#28547f", "#32638f", "#7ab9e2"],
    }[color];

    outerEdge.forEach((point, index) => {
        const next = (index + 1) % 6;
        const bevel = document.createElementNS(svgNamespace, "polygon");
        bevel.setAttribute("points", [point, outerEdge[next], topEdge[next], topEdge[index]].join(" "));
        bevel.setAttribute("fill", edgeColors[index]);
        bevel.setAttribute("class", "tile-bevel");
        tileBody.append(bevel);
    });
    const surface = document.createElementNS(svgNamespace, "polygon");
    surface.setAttribute("class", "tile-surface");
    surface.setAttribute("points", topEdge.join(" "));
    tileBody.append(surface);
    tiles.prepend(tileBody);
    availableTiles.push({ q, r, x, y });
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

    boardTileCoordinates.forEach(({ q, r }) => {
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
    if (isBotTurn() && !performingBotAction) return;
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
    }, 3500);
    if (startingTileCount === 1 && seedState.stageIndex >= 2) tutorialCompleted = true;
    closeSeedDialog(seedState);
    seedState.image.remove();
    plantedSeeds.splice(index, 1);
    availableTiles.push(seedState.tile);
    updateMoneyDisplay();
    saveGame();
}

function getSeedUpgradeCost(seedState) {
    return getGrowthStage(seedState).upgradeCostInCents ??
        seedUpgradeCostInCents;
}

function updateSeedAppearance(seedState) {
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
    const earningPerPayout = (stage.earningInCents / 100).toFixed(2);
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
    if (isBotTurn() && !performingBotAction) return;
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
    return !normalMode || getBoardTileColor(seed.tile.q, seed.tile.r) === selectedColor;
}

function getCurrentPlayerIncome() {
    return plantedSeeds.filter(canManageTree).reduce((total, seed) => total + getGrowthStage(seed).earningInCents, 0);
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

function collectPayout() {
    if (isBotTurn() && !performingBotAction) return;
    if (!gameStarted) return;
    const income = getCurrentPlayerIncome();
    if (!normalMode && income === 0) return;
    moneyInCents += income;
    payoutStatus.textContent = `Collected ${(income / 100).toFixed(2)} leaves.`;
    if (normalMode) {
        if (playerStates.length === 0) initializePlayers();
        syncCurrentPlayer();
        const clockwiseColors = ["green", "yellow", "red"].filter(color => playerStates.some(player => player.color === color));
        const nextColor = clockwiseColors[(clockwiseColors.indexOf(selectedColor) + 1) % clockwiseColors.length];
        const nextPlayer = playerStates.find(player => player.color === nextColor);
        if (nextPlayer) {
            closeSeedDialog(selectedSeed);
            closeObstacleDialog(selectedObstacle);
            selectedColor = nextPlayer.color;
            selectedSeedType = nextPlayer.seedType;
            moneyInCents = nextPlayer.moneyInCents;
            payoutStatus.textContent += ` ${selectedColor[0].toUpperCase() + selectedColor.slice(1)}’s turn.`;
        }
    }
    updateMoneyDisplay();
    saveGame();
    scheduleBotTurn();
}

// Keep ownership separate from the active turn, including across reloads.
function isBotTurn() {
    return normalMode && humanColor !== null && selectedColor !== humanColor;
}

function scheduleBotTurn() {
    const version = ++botTurnVersion;
    if (!gameStarted || !isBotTurn()) return;
    let actions = 0;
    let planted = false;
    let composted = false;
    const step = () => {
        if (version !== botTurnVersion || !gameStarted || !isBotTurn()) return;
        performingBotAction = true;
        try {
            const trees = plantedSeeds.filter(canManageTree);
            const mature = trees.filter(seed => seed.stageIndex === maximumGrowthStage);
            const plantingCost = selectedSeedType === "oak" ? oakSeedCostInCents : seedCostInCents;
            const upgrade = trees.filter(seed => seed.stageIndex < maximumGrowthStage && getSeedUpgradeCost(seed) <= moneyInCents)
                .sort((a, b) => getSeedUpgradeCost(a) - getSeedUpgradeCost(b) || b.upgradesInStage - a.upgradesInStage)[0];
            const name = selectedColor[0].toUpperCase() + selectedColor.slice(1);
            if (actions >= 8) {
                collectPayout();
                return;
            } else if (!composted && getPlantableTiles().length === 0 && mature.length > 1) {
                compostTree(mature[0]);
                composted = true;
                payoutStatus.textContent = `${name} bot composted a mature tree.`;
            } else if (!planted && getPlantableTiles().length > 0 && moneyInCents >= plantingCost) {
                plantSeed();
                planted = true;
                payoutStatus.textContent = `${name} bot planted a ${selectedSeedType}.`;
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
    if (startingTileCount === 1 && !tutorialCompleted && plantedSeeds.length === 0) {
        tutorialPromptReady = false;
        updateMoneyDisplay();
        tutorialWelcomeDialog.showModal();
    }
    saveGame();
    scheduleBotTurn();
}

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
    playerStates = (savedGameData.playerStates ?? []).map(player => ({ ...player }));
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
    if (playerStates.length === 0) initializePlayers();
    updateMoneyDisplay();
    if (normalMode && (!selectedColor || !selectedSeedType)) {
        openPlayerSetup(true);
        return;
    }
    startGame();
}

function startNewGame(withTutorial = false, color = null, withLevels = false, seedType = null) {
    if (!withTutorial && !withLevels &&
        (!["red", "green", "yellow"].includes(color) || !["maple", "birch", "spruce", "oak"].includes(seedType))) {
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
    playerStates = [];
    normalMode = !withTutorial && !withLevels;
    selectedSeedType = normalMode ? seedType : null;
    if (tutorialWelcomeDialog.open) tutorialWelcomeDialog.close();
    document.querySelector(".tutorial-done-prompt").hidden = true;
    payoutControls.setAttribute("data-tutorial-focus", "false");
    selectedColor = normalMode ? color : null;
    humanColor = selectedColor;
    activeBoardColors = normalMode ? choosePlayerColors(color, playerCount) : null;
    tutorialCompleted = false;
    currentLevel = 1;
    startingTileCount = withTutorial ? 1 : withLevels ? 7 : 1 + 7 * activeBoardColors.length;
    boardLayoutVersion = 2;
    resetBoard();
    if (normalMode) {
        plantStartingSprouts();
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
        startNewGame(false, pendingColor, false, pendingSeedType);
    }
});

continueGameButton.addEventListener("click", continueGame);
nextLevelButton.addEventListener("click", advanceToNextLevel);
newGameButton.addEventListener("click", () => startNewGame());
tutorialButton.addEventListener("click", () => startNewGame(true));
window.addEventListener("beforeunload", saveGame);

function plantSeed(treeType = normalMode ? selectedSeedType : "maple") {
    if (isBotTurn() && !performingBotAction) return;
    if (normalMode && treeType !== selectedSeedType) return;
    if (!["maple", "birch", "spruce", "oak"].includes(treeType)) return;
    const plantingCost = treeType === "oak" ? oakSeedCostInCents : seedCostInCents;
    const plantableTiles = getPlantableTiles();
    if (moneyInCents < plantingCost || plantableTiles.length === 0) return;

    const { x, y } = plantableTiles[Math.floor(Math.random() * plantableTiles.length)];
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

plantMapleButton.addEventListener("click", () => plantSeed("maple"));
plantBirchButton.addEventListener("click", () => plantSeed("birch"));
plantSpruceButton.addEventListener("click", () => plantSeed("spruce"));
plantOakButton.addEventListener("click", () => plantSeed("oak"));

buyTileButton.addEventListener("click", () => {
    if (isBotTurn()) return;
    if (moneyInCents < tileCostInCents) return;

    const candidateTiles = new Map();
    boardTileCoordinates.forEach(({ q, r }) => {
        tileNeighborOffsets.forEach(([qOffset, rOffset]) => {
            const candidate = { q: q + qOffset, r: r + rOffset };
            const key = `${candidate.q},${candidate.r}`;
            if (!boardTileKeys.has(key)) {
                candidateTiles.set(key, candidate);
            }
        });
    });
    const candidates = Array.from(candidateTiles.values());
    if (candidates.length === 0) return;

    const { q, r } = candidates[Math.floor(Math.random() * candidates.length)];
    addBoardTile(q, r, true);
    if (!normalMode && currentLevel > 2 && Math.random() < tileObstacleChance) {
        addTileObstacle(q, r);
    }
    moneyInCents -= tileCostInCents;
    updateMoneyDisplay();
    saveGame();
});

function getSavedStartingTileCount(data) {
    if (data.boardTileCount !== undefined) return data.boardTileCount;
    const length = data.boardSideLength ?? 6;
    return 1 + 3 * length * (length - 1);
}

function getNormalBoardCoordinates(colors = activeBoardColors) {
    const coordinates = [{ q: 0, r: 0, color: "blue" }];
    for (const [q, r, color] of [[1, -2, "green"], [1, 1, "yellow"], [-2, 1, "red"]]) {
        if (colors && !colors.includes(color)) continue;
        coordinates.push({ q, r, color });
        tileNeighborOffsets.forEach(([dq, dr]) => coordinates.push({ q: q + dq, r: r + dr, color }));
    }
    return coordinates;
}

function getBoardTileColor(q, r) {
    const purchased = purchasedTileCoordinates.find(tile => tile.q === q && tile.r === r);
    if (purchased?.color) return purchased.color;
    if (!activeBoardColors && startingTileCount !== 22) return selectedColor ?? "green";
    return getNormalBoardCoordinates().find(tile => tile.q === q && tile.r === r)?.color ?? selectedColor ?? "green";
}

function getStartingCoordinates(count, layoutVersion = boardLayoutVersion, colors = activeBoardColors) {
    if (colors || count === 22) return getNormalBoardCoordinates(colors).map(({ q, r }) => ({ q, r }));
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
