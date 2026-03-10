import { getEtfPrice, getStockInfo, getDividendRateRanking } from './src/lib/kis/client';

async function test() {
    console.log("Testing Samsung Electronics (005930)");
    const sec = await getEtfPrice('005930');
    console.log("getEtfPrice(005930):", sec ? sec.bstp_kor_isnm : "Failed");

    const secInfo = await getStockInfo('005930');
    console.log("getStockInfo(005930):", secInfo ? {
        name: secInfo.prdt_abrv_name,
        type: secInfo.prdt_type_cd,
        sec_grp: secInfo.sec_grp_id,
        is_etf: secInfo.prdt_type_cd === '300' // let's see what it returns
    } : "Failed");

    console.log("\nTesting TIGER 배당 (e.g. 161510 or 379800 or 069500 (KODEX 200))");
    const etf = await getEtfPrice('069500');
    console.log("getEtfPrice(069500):", etf ? etf.bstp_kor_isnm : "Failed");

    const etfInfo = await getStockInfo('069500');
    console.log("getStockInfo(069500):", etfInfo ? {
        name: etfInfo.prdt_abrv_name,
        type: etfInfo.prdt_type_cd,
        sec_grp: etfInfo.sec_grp_id
    } : "Failed");
}

test().catch(console.error);
