const tiles = document.querySelector(".hex-tiles");
const moneyAmount = document.querySelector(".money-amount");
const plantButton = document.querySelector(".plant-button");
const daylightClock = document.querySelector(".daylight-clock");
const daylightStatus = document.querySelector(".daylight-status");
const clockDial = document.querySelector(".clock-dial");
const clockFace = document.querySelector(".clock-face");
const pauseClockButton = document.querySelector(".pause-clock");
const clockSpeedButton = document.querySelector(".speed-toggle");
const seedDialog = document.querySelector(".seed-dialog");
const seedPreviewImage = document.querySelector(".seed-preview img");
const seedDescription = document.querySelector(".sprout-description");
const seedProgressBar = document.querySelector(".seed-progress-bar");
const seedProgressCount = document.querySelector(".seed-progress-count");
const seedUpgradeCost = document.querySelector(".seed-upgrade-cost");
let moneyInCents = 50;
const seedCostInCents = 25;
const seedUpgradeCostInCents = 40;
const maximumSeedUpgrades = 4;
const seedEarningInCents = 5;
const sproutEarningInCents = 50;
const dayCycleDuration = 2 * 60 * 1000;
const freeSeedUpgradeInterval = 3 * dayCycleDuration;
const daylightDuration = dayCycleDuration / 2;
const nightDuration = dayCycleDuration - daylightDuration;
const dayEarningTicks = [
    daylightDuration / 8,
    (daylightDuration * 3) / 8,
    (daylightDuration * 5) / 8,
    (daylightDuration * 7) / 8,
];
const nightEarningTicks = [
    daylightDuration + nightDuration / 3,
    daylightDuration + (nightDuration * 2) / 3,
];
let elapsedCycleTime = 0;
let previousFrameTime = performance.now();
let clockSpeed = 1;
let clockPaused = false;
const sideLength = 6;
const radius = 24;
const centerX = 230;
const centerY = 205;
const svgNamespace = "http://www.w3.org/2000/svg";
const availableTiles = [];
const plantedSeeds = [];
let selectedSeed = null;

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
}

function updateSeedAppearance(seedState) {
    const size = 28 + seedState.upgrades * 4;
    const isSprout = seedState.upgrades === maximumSeedUpgrades;

    seedState.image.setAttribute(
        "href",
        isSprout ? "images/sprout.png" : "images/seed.png"
    );
    seedState.image.setAttribute("x", seedState.x - size / 2);
    seedState.image.setAttribute("y", seedState.y - size / 2);
    seedState.image.setAttribute("width", size);
    seedState.image.setAttribute("height", size);
    seedState.image.setAttribute(
        "aria-label",
        isSprout
            ? "Fully grown sprout."
            : `Seed, upgrade ${seedState.upgrades} of ${maximumSeedUpgrades}. Click to upgrade; free upgrade every 3 days.`
    );
    seedState.image.setAttribute("role", "button");
    seedState.image.setAttribute("tabindex", "0");
    seedState.image.classList.add("upgradeable-seed");
}

function updateSeedDialog() {
    if (!selectedSeed) return;

    const isSprout = selectedSeed.upgrades === maximumSeedUpgrades;
    seedPreviewImage.src = isSprout ? "images/sprout.png" : "images/seed.png";
    seedPreviewImage.alt = isSprout ? "Sprout" : "Seed";
    seedDescription.textContent = isSprout
        ? "Sprouts earn 0.5 per tick"
        : "Click to upgrade. Free upgrade every 3 days.";
    seedProgressBar.value = selectedSeed.upgrades;
    seedProgressCount.textContent = `${selectedSeed.upgrades}/${maximumSeedUpgrades}`;
    seedUpgradeCost.textContent = isSprout
        ? "Grown"
        : (seedUpgradeCostInCents / 100).toString();
}

function openSeedDialog(seedState) {
    selectedSeed = seedState;
    updateSeedDialog();
    if (!seedDialog.open) {
        seedDialog.show();
    }
}

function upgradeSeed(seedState) {
    if (
        seedState.upgrades >= maximumSeedUpgrades ||
        moneyInCents < seedUpgradeCostInCents
    ) {
        return;
    }

    moneyInCents -= seedUpgradeCostInCents;
    seedState.upgrades += 1;
    updateSeedAppearance(seedState);
    updateMoneyDisplay();
    if (selectedSeed === seedState) {
        updateSeedDialog();
    }
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
        const freeUpgradesDue = Math.floor(
            (elapsedCycleTime - seed.plantedAtCycleTime) / freeSeedUpgradeInterval
        );
        const upgradesToApply = Math.min(
            freeUpgradesDue - seed.freeUpgradesApplied,
            maximumSeedUpgrades - seed.upgrades
        );

        if (upgradesToApply > 0) {
            seed.upgrades += upgradesToApply;
            seed.freeUpgradesApplied = freeUpgradesDue;
            updateSeedAppearance(seed);
            if (selectedSeed === seed) {
                updateSeedDialog();
            }
        } else {
            seed.freeUpgradesApplied = freeUpgradesDue;
        }
    });
}

function updateDaylightClock(frameTime) {
    const previousElapsedCycleTime = elapsedCycleTime;

    if (!clockPaused) {
        elapsedCycleTime += (frameTime - previousFrameTime) * clockSpeed;
    }
    previousFrameTime = frameTime;

    const daylightTicksPassed =
        countCycleTicks(elapsedCycleTime, dayEarningTicks) -
        countCycleTicks(previousElapsedCycleTime, dayEarningTicks);
    const nightTicksPassed =
        countCycleTicks(elapsedCycleTime, nightEarningTicks) -
        countCycleTicks(previousElapsedCycleTime, nightEarningTicks);
    let earnedMoney = 0;

    plantedSeeds.forEach((seed) => {
        const daylightEarningInCents =
            seed.upgrades === maximumSeedUpgrades ? sproutEarningInCents : seedEarningInCents;
        earnedMoney +=
            daylightTicksPassed * daylightEarningInCents +
            nightTicksPassed * seedEarningInCents;
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

clockSpeedButton.addEventListener("click", () => {
    const tripleSpeedEnabled = clockSpeedButton.getAttribute("aria-pressed") !== "true";
    clockSpeed = tripleSpeedEnabled ? 3 : 1;
    clockSpeedButton.setAttribute("aria-pressed", String(tripleSpeedEnabled));
});

pauseClockButton.addEventListener("click", () => {
    clockPaused = !clockPaused;
    pauseClockButton.textContent = clockPaused ? "▶" : "⏸";
    pauseClockButton.setAttribute("aria-label", `${clockPaused ? "Resume" : "Pause"} daylight clock`);
    pauseClockButton.setAttribute("aria-pressed", String(clockPaused));
    pauseClockButton.title = clockPaused ? "Resume" : "Pause";
});

requestAnimationFrame(updateDaylightClock);

plantButton.addEventListener("click", () => {
    if (moneyInCents < seedCostInCents || availableTiles.length === 0) return;

    const tileIndex = Math.floor(Math.random() * availableTiles.length);
    const { x, y } = availableTiles.splice(tileIndex, 1)[0];
    const seed = document.createElementNS(svgNamespace, "image");

    seed.setAttribute("class", "planted-seed");
    const seedState = {
        image: seed,
        x,
        y,
        upgrades: 0,
        plantedAtCycleTime: elapsedCycleTime,
        freeUpgradesApplied: 0,
    };

    updateSeedAppearance(seedState);
    seed.addEventListener("mouseenter", () => openSeedDialog(seedState));
    seed.addEventListener("mouseleave", () => closeSeedDialog(seedState));
    seed.addEventListener("click", () => upgradeSeed(seedState));
    seed.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            upgradeSeed(seedState);
        }
    });
    tiles.append(seed);
    plantedSeeds.push(seedState);

    moneyInCents -= seedCostInCents;
    updateMoneyDisplay();
});

for (let q = -(sideLength - 1); q < sideLength; q += 1) {
    for (let r = -(sideLength - 1); r < sideLength; r += 1) {
        if (Math.abs(q + r) >= sideLength) continue;

        const x = centerX + Math.sqrt(3) * radius * (q + r / 2);
        const y = centerY + 1.5 * radius * r;
        const points = Array.from({ length: 6 }, (_, index) => {
            const angle = ((index * 60 - 90) * Math.PI) / 180;
            return `${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`;
        }).join(" ");
        const tile = document.createElementNS(svgNamespace, "polygon");

        tile.setAttribute("class", "hex-tile");
        tile.setAttribute("points", points);
        tiles.append(tile);
        availableTiles.push({ x, y });
    }
}