import {createJSONFileManager, generateFileName} from "@/app/services/utilsIO";
import {gateioInterval, gateioSourceName} from "@/app/services/utils";
import {FuturesCandlestick} from "gate-api";


// checking high rise then 1 candle low and on close buy, check how much low it will go
const checkBackCount = 5; // how much candle should check for change
const coefOfRise = 0.01; //percent of increase from checkBackCount to now

(async () => {
    const cacheFilename = generateFileName(gateioSourceName, 'ETH_USDT', gateioInterval, false);

    const {load: loadData} = createJSONFileManager<FuturesCandlestick[]>(cacheFilename);

    let futuresCandlesticksData = loadData();

    futuresCandlesticksData = futuresCandlesticksData ?? [];

    for (const i in futuresCandlesticksData) {
        const candle = futuresCandlesticksData[i];
        if (i <= checkBackCount) {
            continue;
        }
        const backCandle = futuresCandlesticksData[i - checkBackCount];
        backCandle.o

    }

})();
