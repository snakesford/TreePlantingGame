const tiles = document.querySelector(".hex-tiles");
const moneyAmount = document.querySelector(".money-amount");
const plantButton = document.querySelector(".plant-button");
const daylightClock = document.querySelector(".daylight-clock");
const daylightStatus = document.querySelector(".daylight-status");
const clockDial = document.querySelector(".clock-dial");
const pauseClockButton = document.querySelector(".pause-clock");
const clockSpeedButton = document.querySelector(".speed-toggle");
let moneyInCents = 50;
const seedCostInCents = 25;
const seedEarningInCents = 5;
const dayCycleDuration = 2 * 60 * 1000;
const daylightDuration = dayCycleDuration / 2;
const nightDuration = dayCycleDuration - daylightDuration;
const quarterDayDuration = daylightDuration / 4;
const halfNightDuration = nightDuration / 2;
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

function totalDaylightTime(cycleTime) {
    const completedCycles = Math.floor(cycleTime / dayCycleDuration);
    const cyclePosition = cycleTime % dayCycleDuration;

    return completedCycles * daylightDuration + Math.min(cyclePosition, daylightDuration);
}

function totalNightTime(cycleTime) {
    const completedCycles = Math.floor(cycleTime / dayCycleDuration);
    const cyclePosition = cycleTime % dayCycleDuration;

    return completedCycles * nightDuration + Math.max(0, cyclePosition - daylightDuration);
}

function updateDaylightClock(frameTime) {
    const previousElapsedCycleTime = elapsedCycleTime;

    if (!clockPaused) {
        elapsedCycleTime += (frameTime - previousFrameTime) * clockSpeed;
    }
    previousFrameTime = frameTime;

    const daylightTimePassed =
        totalDaylightTime(elapsedCycleTime) - totalDaylightTime(previousElapsedCycleTime);
    const nightTimePassed =
        totalNightTime(elapsedCycleTime) - totalNightTime(previousElapsedCycleTime);
    let earnedMoney = 0;

    plantedSeeds.forEach((seed) => {
        seed.daylightTime += daylightTimePassed;
        seed.nightTime += nightTimePassed;
        const completedQuarterDays = Math.floor(seed.daylightTime / quarterDayDuration);
        const completedHalfNights = Math.floor(seed.nightTime / halfNightDuration);

        if (completedQuarterDays > 0 || completedHalfNights > 0) {
            earnedMoney += (completedQuarterDays + completedHalfNights) * seedEarningInCents;
            seed.daylightTime %= quarterDayDuration;
            seed.nightTime %= halfNightDuration;
        }
    });

    if (earnedMoney > 0) {
        moneyInCents += earnedMoney;
        moneyAmount.textContent = (moneyInCents / 100).toString();
        plantButton.disabled = moneyInCents < seedCostInCents || availableTiles.length === 0;
    }

    const cyclePosition = elapsedCycleTime % dayCycleDuration;
    const isDaylight = cyclePosition < dayCycleDuration / 2;
    const status = isDaylight ? "Day" : "Night";
    const rotation = -(cyclePosition / dayCycleDuration) * 360;

    daylightStatus.textContent = status;
    daylightClock.setAttribute("aria-label", `Day and night cycle: ${status}`);
    clockDial.style.transform = `rotate(${rotation}deg)`;
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
    seed.setAttribute("href", "images/seed.png");
    seed.setAttribute("x", x - 14);
    seed.setAttribute("y", y - 14);
    seed.setAttribute("width", "28");
    seed.setAttribute("height", "28");
    seed.setAttribute("role", "img");
    seed.setAttribute("aria-label", "Planted seed");
    tiles.append(seed);
    plantedSeeds.push({ daylightTime: 0, nightTime: 0 });

    moneyInCents -= seedCostInCents;
    moneyAmount.textContent = (moneyInCents / 100).toString();
    plantButton.disabled = moneyInCents < seedCostInCents || availableTiles.length === 0;
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