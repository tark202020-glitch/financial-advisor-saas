const { getInvestorTrend } = require('./src/lib/kis/client');

(async () => {
    try {
        console.log("Probing for KOSPI (0001)...");
        // Note: To run this in Node, we need environment or quick shim.
        // Actually, client.ts imports 'next/server' or relies on Next.js env.
        // It's better to Probe via the *Running Server* Route I just built.

        // I will fetch the LOCALHOST endpoint with ?symbol=0001 if I can Parametrize it.
        // But route.ts is hardcoded to 005930. 
        // I will Temporarily modify route.ts to accept query param for testing? 
        // No, I'll just modify route.ts to '0001' and see if it breaks locally.
    } catch (e) {
        console.error(e);
    }
})();
