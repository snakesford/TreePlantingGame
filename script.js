const tiles = document.querySelector(".hex-tiles");
const moneyAmount = document.querySelector(".money-amount");
const plantButton = document.querySelector(".plant-button");
const daylightClock = document.querySelector(".daylight-clock");
const daylightStatus = document.querySelector(".daylight-status");
let moneyInCents = 50;
const seedCostInCents = 25;
const dayCycleDuration = 2 * 60 * 1000;
const dayCycleStartedAt = Date.now();
const sideLength = 6;
const radius = 24;
const centerX = 230;
const centerY = 205;
const svgNamespace = "http://www.w3.org/2000/svg";
const availableTiles = [];

function updateDaylightClock() {
    const cyclePosition = (Date.now() - dayCycleStartedAt) % dayCycleDuration;
    const isDaylight = cyclePosition < dayCycleDuration / 2;
    const status = isDaylight ? "Day" : "Night";

    daylightStatus.textContent = status;
    daylightClock.setAttribute("aria-label", `Day and night cycle: ${status}`);
}

updateDaylightClock();
setInterval(updateDaylightClock, 1000);

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