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
let levelOneCompleted = false;
let levelTwoCompleted = false;
const completedLevels = new Set();
let matureTreesComposted = 0;
const levelObjective = document.querySelector(".level-objective");
const levelProgressText = document.querySelector(".level-progress-text");
const levelNotification = document.querySelector(".level-notification");
const moneyAmount = document.querySelector(".money-amount");
const plantMapleButton = document.querySelector(".plant-maple-button");
const plantBirchButton = document.querySelector(".plant-birch-button");
const plantSpruceButton = document.querySelector(".plant-spruce-button");
const plantOakButton = document.querySelector(".plant-oak-button");
const buyTileButton = document.querySelector(".buy-tile-button");
const daylightClock = document.querySelector(".daylight-clock");
const daylightStatus = document.querySelector(".daylight-status");
const clockDial = document.querySelector(".clock-dial");
const clockFace = document.querySelector(".clock-face");
const pauseClockButton = document.querySelector(".pause-clock");
const clockSpeedButton = document.querySelector(".speed-toggle");
const saveSlotDialog = document.querySelector(".save-slot-dialog");
const saveSlotSummary = document.querySelector(".save-slot-summary");
const continueGameButton = document.querySelector(".continue-game-button");
const newGameButton = document.querySelector(".new-game-button");
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
let moneyInCents = 9999999;
const seedCostInCents = 100;
const oakSeedCostInCents = 300;
const tileCostInCents = 2500;
const seedUpgradeCostInCents = 50;
const dayCycleDuration = 60 * 1000;
const saveStorageKey = "tree-planting-game-save";
const saveVersion = 4;
const standardFreeUpgradeIntervalInDays = 3;
const growthStages = [
    { name: "Seed", image: "images/seed.png", earningInCents: 10 },
    {
        name: "Germination",
        image: "images/germination.png",
        earningInCents: 20,
        upgradeCostInCents: 150,
        freeUpgradeIntervalInDays: 5,
    },
    {
        name: "Sprout",
        image: "images/sprout.png",
        earningInCents: 40,
        upgradeCostInCents: 400,
        freeUpgradeIntervalInDays: 8,
    },
    {
        name: "Seedling",
        image: "images/seedling.png",
        earningInCents: 75,
        upgradeCostInCents: 1000,
        freeUpgradeIntervalInDays: 12,
    },
    {
        name: "Sapling",
        image: "images/sapling.png",
        earningInCents: 150,
        upgradeCostInCents: 2500,
        freeUpgradeIntervalInDays: 18,
    },
    {
        name: "Mature Tree",
        image: "images/mature.png",
        earningInCents: 300,
        upgradeCostInCents: 0,
        freeUpgradeIntervalInDays: 0,
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
    freeUpgradeIntervalInDays: [2, 2, 3, 3, 4, 0][index],
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
    freeUpgradeIntervalInDays: [1, 2, 2, 3, 3, 0][index],
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
    freeUpgradeIntervalInDays: [3, 4, 5, 5, 6, 0][index],
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
    freeUpgradeIntervalInDays: [4, 5, 6, 8, 10, 0][index],
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
const daylightDuration = dayCycleDuration / 2;
const earningTicks = [
    0,
    daylightDuration,
];
let elapsedCycleTime = 0;
let previousFrameTime = performance.now();
let clockSpeed = 1;
let clockPaused = false;
let gameStarted = false;
const levelTileCounts = [7, 7, 12, 15, 19, 19, 27, 36];
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
    if (!gameStarted) return;

    const saveData = {
        version: saveVersion,
        currentLevel,
        boardTileCount: startingTileCount,
        boardLayoutVersion,
        levelOneCompleted,
        levelTwoCompleted,
        completedLevels: Array.from(completedLevels),
        matureTreesComposted,
        moneyInCents,
        elapsedCycleTime,
        clockSpeed,
        additionalTiles: purchasedTileCoordinates.map(({ q, r }) => ({ q, r })),
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
            nextFreeUpgradeAtCycleTime: seed.nextFreeUpgradeAtCycleTime,
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
                seed.nextFreeUpgradeAtCycleTime = savedGameData.elapsedCycleTime;
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
        ![1, 2, 3, saveVersion].includes(data.version) ||
        (data.currentLevel !== undefined && (!Number.isInteger(data.currentLevel) || data.currentLevel < 1 || data.currentLevel > 8)) ||
        (data.boardLayoutVersion !== undefined && ![1, 2].includes(data.boardLayoutVersion)) ||
        (data.boardTileCount !== undefined && ![7, 12, 15, 19, 27, 36, 91].includes(data.boardTileCount)) ||
        (data.boardSideLength !== undefined && ![2, 6].includes(data.boardSideLength)) ||
        (data.levelOneCompleted !== undefined && typeof data.levelOneCompleted !== "boolean") ||
        (data.levelTwoCompleted !== undefined && typeof data.levelTwoCompleted !== "boolean") ||
        (data.completedLevels !== undefined && (!Array.isArray(data.completedLevels) ||
            data.completedLevels.some((level) => !Number.isInteger(level) || level < 1 || level > (data.currentLevel ?? 1)))) ||
        (data.matureTreesComposted !== undefined &&
            (!Number.isSafeInteger(data.matureTreesComposted) || data.matureTreesComposted < 0)) ||
        !Number.isFinite(data.moneyInCents) ||
        data.moneyInCents < 0 ||
        !Number.isFinite(data.elapsedCycleTime) ||
        data.elapsedCycleTime < 0 ||
        ![1, 3].includes(data.clockSpeed) ||
        !Array.isArray(data.seeds) ||
        (data.additionalTiles !== undefined &&
            !Array.isArray(data.additionalTiles)) ||
        (data.obstacles !== undefined && !Array.isArray(data.obstacles))
    ) {
        return false;
    }

    const obstacleTypes = new Set(
        tileObstacleDefinitions.map((obstacle) => obstacle.key)
    );
    const additionalTiles = data.additionalTiles ?? [];
    const obstacleTiles = data.obstacles ?? [];
    const startingTiles = getStartingCoordinates(getSavedStartingTileCount(data), data.boardLayoutVersion ?? 1);
    const knownTileKeys = new Set(startingTiles.map(({ q, r }) => getTileKey(q, r)));
    const tilePositions = startingTiles.map(({ q, r }) => getTileCenter(q, r));
    for (const tile of additionalTiles) {
        if (
            !tile ||
            !Number.isInteger(tile.q) ||
            !Number.isInteger(tile.r)
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
            seed.upgradesInStage >= getUpgradesPerStage(seed) ||
            !Number.isFinite(seed.nextFreeUpgradeAtCycleTime) ||
            seed.nextFreeUpgradeAtCycleTime < 0
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

function countCycleTicks(cycleTime, tickTimes) {
    const completedCycles = Math.floor(cycleTime / dayCycleDuration);
    const cyclePosition = cycleTime % dayCycleDuration;

    return (
        completedCycles * tickTimes.length +
        tickTimes.filter((tickTime) => tickTime <= cyclePosition).length
    );
}

function updateMoneyDisplay() {
    updateLevelProgress();
    moneyAmount.textContent = (moneyInCents / 100).toString();
    const cannotPlantSeed = moneyInCents < seedCostInCents || availableTiles.length === 0;
    plantMapleButton.disabled = cannotPlantSeed;
    plantBirchButton.disabled = cannotPlantSeed;
    plantSpruceButton.disabled = cannotPlantSeed;
    plantOakButton.disabled = moneyInCents < oakSeedCostInCents || availableTiles.length === 0;
    buyTileButton.disabled = moneyInCents < tileCostInCents;
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
    if (currentLevel === 1) return false;
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
            !boardTileKeys.has(getTileKey(q, r))
        ) {
            return;
        }
        addTileObstacle(q, r, type);
    });
}

function addBoardTile(q, r, isPurchased = false) {
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
    tileBody.setAttribute("data-points", points);
    tileBody.addEventListener("pointerdown", (event) => pressTile(key, event, tileBody));
    tileBody.addEventListener("lostpointercapture", releasePressedTreeTile);
    tileElements.set(key, tileBody);
    tileBody.append(tile);

    const bevelPoints = (size, yOffset = 0) => Array.from({ length: 6 }, (_, index) => {
        const angle = ((index * 60 - 90) * Math.PI) / 180;
        return `${x + size * Math.cos(angle)},${y + yOffset + size * Math.sin(angle)}`;
    });
    const outerEdge = bevelPoints(tileRadius);
    const topEdge = bevelPoints(radius - 5, -1);
    const edgeColors = ["#9ac68a", "#679b60", "#365f38", "#284c30", "#305a37", "#78a76b"];

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
        purchasedTileCoordinates.push({ q, r });
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
    const index = plantedSeeds.indexOf(seedState);
    if (index < 0) return;

    if (currentLevel === 8 && seedState.stageIndex === maximumGrowthStage) {
        matureTreesComposted += 1;
    }
    moneyInCents += getCompostReward(seedState);
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

function getFreeUpgradeInterval(seedState) {
    const intervalInDays =
        getGrowthStage(seedState).freeUpgradeIntervalInDays ??
        standardFreeUpgradeIntervalInDays;
    return intervalInDays * dayCycleDuration;
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
            : `${stage.name}, ${seedState.upgradesInStage} of ${getUpgradesPerStage(seedState)} upgrades. Click to upgrade; free upgrade every ${getFreeUpgradeInterval(seedState) / dayCycleDuration} days.`
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
    const freeUpgradeIntervalInDays =
        getFreeUpgradeInterval(selectedSeed) / dayCycleDuration;
    showLeafAmount(seedDescription, earningPerPayout, "Earns ", isFullyGrown
        ? " per payout."
        : ` per payout. Click to upgrade; free growth every ${freeUpgradeIntervalInDays} days.`);
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

function advanceSeedGrowth(seedState, upgradeTime = elapsedCycleTime) {
    seedState.upgradesInStage += 1;
    if (seedState.upgradesInStage === getUpgradesPerStage(seedState)) {
        seedState.stageIndex += 1;
        seedState.upgradesInStage = 0;
    }
    seedState.nextFreeUpgradeAtCycleTime =
        upgradeTime + getFreeUpgradeInterval(seedState);

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

function applyFreeSeedUpgrades() {
    plantedSeeds.forEach((seed) => {
        while (
            seed.stageIndex < maximumGrowthStage &&
            elapsedCycleTime >= seed.nextFreeUpgradeAtCycleTime
        ) {
            advanceSeedGrowth(seed, seed.nextFreeUpgradeAtCycleTime);
        }
    });
}

function updateDaylightClock(frameTime) {
    const previousElapsedCycleTime = elapsedCycleTime;

    if (!clockPaused) {
        elapsedCycleTime += (frameTime - previousFrameTime) * clockSpeed;
    }
    previousFrameTime = frameTime;

    const payoutsPassed =
        countCycleTicks(elapsedCycleTime, earningTicks) -
        countCycleTicks(previousElapsedCycleTime, earningTicks);
    let earnedMoney = 0;

    plantedSeeds.forEach((seed) => {
        const earningInCents = getGrowthStage(seed).earningInCents;
        earnedMoney += payoutsPassed * earningInCents;
    });

    if (earnedMoney > 0) {
        moneyInCents += earnedMoney;
        updateMoneyDisplay();
    }
    applyFreeSeedUpgrades();

    const cyclePosition = elapsedCycleTime % dayCycleDuration;
    const isDaylight = cyclePosition < dayCycleDuration / 2;
    const status = isDaylight ? "Day" : "Night";
    const rotation = -(cyclePosition / dayCycleDuration) * 360;

    daylightStatus.textContent = status;
    daylightClock.setAttribute("aria-label", `Day and night cycle: ${status}`);
    clockFace.style.setProperty("--clock-rotation", `${rotation}deg`);
    requestAnimationFrame(updateDaylightClock);
}

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        previousFrameTime = performance.now();
        requestAnimationFrame(updateDaylightClock);
        window.setInterval(saveGame, 1000);
    }
    saveSlotDialog.close();
    saveGame();
}

function continueGame() {
    if (!savedGameData || !isValidSaveData(savedGameData)) return;

    moneyInCents = savedGameData.moneyInCents;
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
    elapsedCycleTime = savedGameData.elapsedCycleTime;
    clockSpeed = savedGameData.clockSpeed;
    clockSpeedButton.setAttribute("aria-pressed", String(clockSpeed === 3));
    (savedGameData.additionalTiles ?? []).forEach(({ q, r }) => {
        addBoardTile(q, r, true);
    });
    restoreSavedTileObstacles(savedGameData.obstacles ?? []);
    savedGameData.seeds.forEach(addPlantedSeed);
    updateMoneyDisplay();
    startGame();
}

function startNewGame() {
    if (
        hasStoredSave &&
        !window.confirm("Start a new game and replace the saved progress?")
    ) {
        return;
    }

    try {
        localStorage.removeItem(saveStorageKey);
    } catch (error) {
        saveStatus.textContent = "Unable to clear the previous save.";
        console.error("Could not clear previous saved game.", error);
    }

    savedGameData = null;
    currentLevel = 1;
    startingTileCount = levelTileCounts[0];
    boardLayoutVersion = 2;
    resetBoard();
    levelOneCompleted = false;
    levelTwoCompleted = false;
    matureTreesComposted = 0;
    completedLevels.clear();
    hasStoredSave = false;
    moneyInCents = moneyInCents;
    elapsedCycleTime = 0;
    clockSpeed = 1;
    clockPaused = false;
    spawnRandomTileObstacles();
    clockSpeedButton.setAttribute("aria-pressed", "false");
    pauseClockButton.textContent = "⏸";
    pauseClockButton.setAttribute("aria-label", "Pause daylight clock");
    pauseClockButton.setAttribute("aria-pressed", "false");
    pauseClockButton.title = "Pause";
    updateMoneyDisplay();
    startGame();
}

clockSpeedButton.addEventListener("click", () => {
    const tripleSpeedEnabled = clockSpeedButton.getAttribute("aria-pressed") !== "true";
    clockSpeed = tripleSpeedEnabled ? 3 : 1;
    clockSpeedButton.setAttribute("aria-pressed", String(tripleSpeedEnabled));
    saveGame();
});

pauseClockButton.addEventListener("click", () => {
    clockPaused = !clockPaused;
    pauseClockButton.textContent = clockPaused ? "▶" : "⏸";
    pauseClockButton.setAttribute("aria-label", `${clockPaused ? "Resume" : "Pause"} daylight clock`);
    pauseClockButton.setAttribute("aria-pressed", String(clockPaused));
    pauseClockButton.title = clockPaused ? "Resume" : "Pause";
    saveGame();
});

continueGameButton.addEventListener("click", continueGame);
nextLevelButton.addEventListener("click", advanceToNextLevel);
newGameButton.addEventListener("click", startNewGame);
window.addEventListener("beforeunload", saveGame);

function plantSeed(treeType = "maple") {
    if (!["maple", "birch", "spruce", "oak"].includes(treeType)) return;
    const plantingCost = treeType === "oak" ? oakSeedCostInCents : seedCostInCents;
    if (moneyInCents < plantingCost || availableTiles.length === 0) return;

    const { x, y } = availableTiles[
        Math.floor(Math.random() * availableTiles.length)
    ];
    addPlantedSeed({
        treeType,
        x,
        y,
        stageIndex: 0,
        upgradesInStage: 0,
        nextFreeUpgradeAtCycleTime:
            elapsedCycleTime + getFreeUpgradeInterval({ treeType, stageIndex: 0 }),
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
    if (currentLevel > 2 && Math.random() < tileObstacleChance) {
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

function getStartingCoordinates(count, layoutVersion = boardLayoutVersion) {
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
saveSlotDialog.showModal();
