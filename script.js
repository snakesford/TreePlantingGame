const tiles = document.querySelector(".hex-tiles");
const moneyAmount = document.querySelector(".money-amount");
const plantButton = document.querySelector(".plant-button");
let moneyInCents = 50;
const seedCostInCents = 25;
const sideLength = 6;
const radius = 24;
const centerX = 230;
const centerY = 205;
const svgNamespace = "http://www.w3.org/2000/svg";

plantButton.addEventListener("click", () => {
    if (moneyInCents < seedCostInCents) return;

    moneyInCents -= seedCostInCents;
    moneyAmount.textContent = (moneyInCents / 100).toString();
    plantButton.disabled = moneyInCents < seedCostInCents;
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
    }
}