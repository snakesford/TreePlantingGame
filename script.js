const tiles = document.querySelector(".hex-tiles");
const moneyAmount = document.querySelector(".money-amount");
const plantButton = document.querySelector(".plant-button");
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
let moneyInCents = 9999;
const seedCostInCents = 100;
const tileCostInCents = 2500;
const seedUpgradeCostInCents = 50;
const dayCycleDuration = 60 * 1000;
const saveStorageKey = "tree-planting-game-save";
const saveVersion = 1;
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
        upgradeCostInCents: 6000,
        freeUpgradeIntervalInDays: 25,
    },
    { name: "Ancient Tree", image: "images/ancient.png", earningInCents: 500 },
];
const upgradesPerGrowthStage = 4;
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
const sideLength = 6;
const radius = 24;
const centerX = 230;
const centerY = 205;
const svgNamespace = "http://www.w3.org/2000/svg";
const availableTiles = [];
const boardTileCoordinates = [];
const boardTileKeys = new Set();
const purchasedTileCoordinates = [];
const plantedSeeds = [];
let selectedSeed = null;
let savedGameData = null;
let hasStoredSave = false;

function saveGame() {
    if (!gameStarted) return;

    const saveData = {
        version: saveVersion,
        moneyInCents,
        elapsedCycleTime,
        clockSpeed,
        additionalTiles: purchasedTileCoordinates.map(({ q, r }) => ({ q, r })),
        seeds: plantedSeeds.map((seed) => ({
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

    const balance = (savedGameData.moneyInCents / 100).toFixed(2);
    saveSlotSummary.textContent =
        `Balance: $${balance} · Trees: ${savedGameData.seeds.length}`;
    continueGameButton.hidden = false;
}

function isValidSaveData(data) {
    if (
        !data ||
        typeof data !== "object" ||
        data.version !== saveVersion ||
        !Number.isFinite(data.moneyInCents) ||
        data.moneyInCents < 0 ||
        !Number.isFinite(data.elapsedCycleTime) ||
        data.elapsedCycleTime < 0 ||
        ![1, 3].includes(data.clockSpeed) ||
        !Array.isArray(data.seeds) ||
        (data.additionalTiles !== undefined &&
            !Array.isArray(data.additionalTiles))
    ) {
        return false;
    }

    const additionalTiles = data.additionalTiles ?? [];
    const knownTileKeys = new Set(boardTileKeys);
    const tilePositions = availableTiles.map(({ x, y }) => ({ x, y }));
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

    if (data.seeds.length > tilePositions.length) return false;

    const occupiedPositions = new Set();
    return data.seeds.every((seed) => {
        if (
            !seed ||
            !Number.isFinite(seed.x) ||
            !Number.isFinite(seed.y) ||
            !Number.isInteger(seed.stageIndex) ||
            seed.stageIndex < 0 ||
            seed.stageIndex > maximumGrowthStage ||
            !Number.isInteger(seed.upgradesInStage) ||
            seed.upgradesInStage < 0 ||
            seed.upgradesInStage >= upgradesPerGrowthStage ||
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
    moneyAmount.textContent = (moneyInCents / 100).toString();
    plantButton.disabled = moneyInCents < seedCostInCents || availableTiles.length === 0;
    buyTileButton.disabled = moneyInCents < tileCostInCents;
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

function addBoardTile(q, r, isPurchased = false) {
    const key = `${q},${r}`;
    if (boardTileKeys.has(key)) return false;

    const { x, y } = getTileCenter(q, r);
    const points = Array.from({ length: 6 }, (_, index) => {
        const angle = ((index * 60 - 90) * Math.PI) / 180;
        return `${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`;
    }).join(" ");
    const tile = document.createElementNS(svgNamespace, "polygon");

    tile.setAttribute("class", "hex-tile");
    tile.setAttribute("points", points);
    tiles.prepend(tile);
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

    availableTiles.splice(tileIndex, 1);
    const image = document.createElementNS(svgNamespace, "image");
    const seedState = { ...seedData, image };

    image.setAttribute("class", "planted-seed");
    updateSeedAppearance(seedState);
    image.addEventListener("mouseenter", () => openSeedDialog(seedState));
    image.addEventListener("mouseleave", () => closeSeedDialog(seedState));
    image.addEventListener("click", () => upgradeSeed(seedState));
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

function getSeedUpgradeCost(seedState) {
    return growthStages[seedState.stageIndex].upgradeCostInCents ??
        seedUpgradeCostInCents;
}

function getFreeUpgradeInterval(stageIndex) {
    const intervalInDays =
        growthStages[stageIndex].freeUpgradeIntervalInDays ??
        standardFreeUpgradeIntervalInDays;
    return intervalInDays * dayCycleDuration;
}

function updateSeedAppearance(seedState) {
    const size =
        28 + seedState.stageIndex * 8 + seedState.upgradesInStage * 2;
    const stage = growthStages[seedState.stageIndex];

    seedState.image.setAttribute("href", stage.image);
    seedState.image.setAttribute("x", seedState.x - size / 2);
    seedState.image.setAttribute("y", seedState.y - size / 2);
    seedState.image.setAttribute("width", size);
    seedState.image.setAttribute("height", size);
    seedState.image.setAttribute(
        "aria-label",
        seedState.stageIndex === maximumGrowthStage
            ? `Fully grown ${stage.name.toLowerCase()}.`
            : `${stage.name}, ${seedState.upgradesInStage} of ${upgradesPerGrowthStage} upgrades. Click to upgrade; free upgrade every ${getFreeUpgradeInterval(seedState.stageIndex) / dayCycleDuration} days.`
    );
    seedState.image.setAttribute("role", "button");
    seedState.image.setAttribute("tabindex", "0");
    seedState.image.classList.add("upgradeable-seed");
}

function updateSeedDialog() {
    if (!selectedSeed) return;

    const stage = growthStages[selectedSeed.stageIndex];
    const isAncientTree = selectedSeed.stageIndex === maximumGrowthStage;
    seedDialogTitle.textContent = stage.name;
    seedPreviewImage.src = stage.image;
    seedPreviewImage.alt = stage.name;
    const earningPerPayout = `$${(stage.earningInCents / 100).toFixed(2)}`;
    const freeUpgradeIntervalInDays =
        getFreeUpgradeInterval(selectedSeed.stageIndex) / dayCycleDuration;
    seedDescription.textContent = isAncientTree
        ? `Earns ${earningPerPayout} per payout.`
        : `Earns ${earningPerPayout} per payout. Click to upgrade; free growth every ${freeUpgradeIntervalInDays} days.`;
    const displayedUpgrades = isAncientTree
        ? upgradesPerGrowthStage
        : selectedSeed.upgradesInStage;
    seedProgressBar.value = displayedUpgrades;
    seedProgressCount.textContent = `${displayedUpgrades}/${upgradesPerGrowthStage}`;
    seedUpgradeCost.textContent = isAncientTree
        ? "Grown"
        : (getSeedUpgradeCost(selectedSeed) / 100).toString();
}

function openSeedDialog(seedState) {
    selectedSeed = seedState;
    updateSeedDialog();
    if (!seedDialog.open) {
        seedDialog.show();
    }
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
    if (seedState.upgradesInStage === upgradesPerGrowthStage) {
        seedState.stageIndex += 1;
        seedState.upgradesInStage = 0;
    }
    seedState.nextFreeUpgradeAtCycleTime =
        upgradeTime + getFreeUpgradeInterval(seedState.stageIndex);

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
        const earningInCents = growthStages[seed.stageIndex].earningInCents;
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
    elapsedCycleTime = savedGameData.elapsedCycleTime;
    clockSpeed = savedGameData.clockSpeed;
    clockSpeedButton.setAttribute("aria-pressed", String(clockSpeed === 3));
    (savedGameData.additionalTiles ?? []).forEach(({ q, r }) => {
        addBoardTile(q, r, true);
    });
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
    hasStoredSave = false;
    moneyInCents = moneyInCents;
    elapsedCycleTime = 0;
    clockSpeed = 1;
    clockPaused = false;
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
newGameButton.addEventListener("click", startNewGame);
window.addEventListener("beforeunload", saveGame);

plantButton.addEventListener("click", () => {
    if (moneyInCents < seedCostInCents || availableTiles.length === 0) return;

    const { x, y } = availableTiles[
        Math.floor(Math.random() * availableTiles.length)
    ];
    addPlantedSeed({
        x,
        y,
        stageIndex: 0,
        upgradesInStage: 0,
        nextFreeUpgradeAtCycleTime:
            elapsedCycleTime + getFreeUpgradeInterval(0),
    });
    moneyInCents -= seedCostInCents;
    updateMoneyDisplay();
    saveGame();
});

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
    moneyInCents -= tileCostInCents;
    updateMoneyDisplay();
    saveGame();
});

for (let q = -(sideLength - 1); q < sideLength; q += 1) {
    for (let r = -(sideLength - 1); r < sideLength; r += 1) {
        if (Math.abs(q + r) >= sideLength) continue;

        addBoardTile(q, r);
    }
}

readSavedGame();
saveSlotDialog.showModal();