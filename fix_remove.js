const fs = require('fs');
const path = 'src/context/PortfolioContext.tsx';
let content = fs.readFileSync(path, 'utf8');

// Target Start: The comment in removeTradeLog
const targetStart = "// Recalculate asset quantity";
const targetEnd = "await fetchPortfolio(user.id);";

// We need to be careful not to match other functions.
// removeTradeLog is near the end.
// I'll search for "const removeTradeLog = async" and then look inside.

const funcStart = "const removeTradeLog = async";
const funcIdx = content.indexOf(funcStart);

if (funcIdx === -1) {
    console.log("Error: removeTradeLog function not found");
    process.exit(1);
}

const startIdx = content.indexOf(targetStart, funcIdx);
if (startIdx === -1) {
    console.log("Error: Target comment not found inside removeTradeLog");
    // Debug: print snippet around funcIdx
    console.log("Snippet:", content.substring(funcIdx, funcIdx + 200));
    process.exit(1);
}

const endIdx = content.indexOf(targetEnd, startIdx);
if (endIdx === -1) {
    console.log("Error: Target end (fetchPortfolio) not found");
    process.exit(1);
}

console.log("Found block to replace from", startIdx, "to", endIdx);
const toReplace = content.substring(startIdx, endIdx);
console.log("Current Content Length:", toReplace.length);
console.log("Current Content Preview:", toReplace.substring(0, 50) + "...");

const replacement = "await recalculateAssetMetrics(assetId);\n            ";

const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx);

fs.writeFileSync(path, newContent, 'utf8');
console.log("Successfully replaced block.");
