
// No require needed for Node 18+

async function testYahoo(symbol) {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
        console.log(`Fetching ${url}...`);
        const res = await fetch(url);
        const data = await res.json();

        if (data.chart && data.chart.result && data.chart.result[0]) {
            const meta = data.chart.result[0].meta;
            console.log(`[${symbol}] Meta:`, JSON.stringify(meta, null, 2));
        } else {
            console.log(`[${symbol}] No result found`);
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error(`[${symbol}] Error:`, e);
    }
}

(async () => {
    await testYahoo('KRW=X');
    await testYahoo('GC=F');
})();
