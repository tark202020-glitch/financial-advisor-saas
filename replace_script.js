const fs = require('fs');
const path = 'src/context/PortfolioContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1Start = "// Recalculate asset quantity from scratch for accuracy";
const target1End = "await fetchPortfolio(user.id);";

// Find index of start
const startIdx = content.indexOf(target1Start);
if (startIdx !== -1) {
    const endIdx = content.indexOf(target1End, startIdx);
    if (endIdx !== -1) {
        const toReplace = content.substring(startIdx, endIdx);
        console.log("Found Block 1 (updateTradeLog) length:", toReplace.length);
        const replacement = "await recalculateAssetMetrics(assetId);\n            ";
        // Note: endIdx points to 'await fetchPortfolio...', so we keep it or replace it?
        // My target in previous attempts included fetchPortfolio.
        // Here I want to replace everything BEFORE fetchPortfolio.

        content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
        console.log("Replaced Block 1");
    } else {
        console.log("Block 1 end not found");
    }
} else {
    console.log("Block 1 start not found");
}

// Block 2: removeTradeLog
const target2Start = "// Recalculate asset quantity";
// Note: This comment is shorter than block 1's comment.
// Block 1: "// Recalculate asset quantity from scratch for accuracy"
// Block 2: "// Recalculate asset quantity" (line 409)

const startIdx2 = content.indexOf(target2Start);
// Note: indexOf might find the first one again if I didn't replace it correctly, but first one is long comment.
// The strings are different.

if (startIdx2 !== -1) {
    const endIdx2 = content.indexOf(target1End, startIdx2); // Same end marker
    if (endIdx2 !== -1) {
        const toReplace = content.substring(startIdx2, endIdx2);
        console.log("Found Block 2 (removeTradeLog) length:", toReplace.length);
        const replacement = "await recalculateAssetMetrics(assetId);\n            ";
        content = content.substring(0, startIdx2) + replacement + content.substring(endIdx2);
        console.log("Replaced Block 2");
    } else {
        console.log("Block 2 end not found");
    }
} else {
    console.log("Block 2 start not found");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Done");
