import {ApiClient, FuturesApi, FuturesCandlestick} from 'gate-api';
import {createJSONFileManager} from "@/app/services/utils";

const interval = "5m";
const startBackFrom = 365 * 24 * 60 * 60; //1 year
const chunkTime = 5 * 24 * 60 * 60; //5 days

type TListFuturesCandlesticksOpt = {
    from?: number;
    to?: number;
    limit?: number;
    interval?: '10s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '7d' | '1w' | '30d';
}


const getCurrentTimestamp = () => {
    return Math.round(Date.now() / 1000);
}

const mergeCandleSticks = (candlesticks1: FuturesCandlestick[], candlesticks2: FuturesCandlestick[]): FuturesCandlestick[] => {
    const result = [...candlesticks1];
    const mapTimeToIndex = new Map();
    for (let i in result) {
        mapTimeToIndex.set(result[i].t, i);
    }

    for (let candle of candlesticks2) {
        const index = mapTimeToIndex.get(candle.t);
        if (index !== undefined) {
            result[index] = candle;
        } else {
            result.push(candle);
        }
    }

    return result;
}

const findMinMaxCandleIndex = (candles: FuturesCandlestick[], startFromIndex: number, toIndex: number, min: boolean): number => {
    let result = startFromIndex;
    for (let i = startFromIndex; i <= toIndex; i++) {
        if (min) {
            // @ts-ignore
            if (candles[i].l < candles[result].l) {
                result = i;
            }
        } else {
            // @ts-ignore
            if (candles[i].t > candles[result].t) {
                result = i;
            }
        }
    }
    return result;
}

(async () => {
    //load data from gate.io
    const pair = 'BTC_USDT';

    const client = new ApiClient();

    const futuresApi = new FuturesApi(client);
    const settle = "usdt"; // 'btc' | 'usdt' | 'usd' | Settle currency

    const {body: contracts} = await futuresApi.listFuturesContracts(settle);
    console.log(contracts.length);

    console.log('contract', contracts[0]);
    const cacheFilename = `./cache/gateio-${contracts[0].name}@${interval}`;

    const {save: saveData, load: loadData} = createJSONFileManager<FuturesCandlestick[]>(cacheFilename);

    let futuresCandlesticksData = loadData();


    let lastTimestamp = futuresCandlesticksData.length > 0 ?
        futuresCandlesticksData[futuresCandlesticksData.length - 1].t || 0 :
        getCurrentTimestamp() - startBackFrom;

    console.log(futuresCandlesticksData[futuresCandlesticksData.length - 1]);

    console.log('last candle time', new Date(lastTimestamp * 1000));

    let stop = false;
    while (!stop) {
        if (lastTimestamp > getCurrentTimestamp()) {
            lastTimestamp = getCurrentTimestamp();
            stop = true;
        }
        const from = lastTimestamp - chunkTime;
        const to = lastTimestamp;
        console.log('getting from to', new Date(from * 1000), new Date(to * 1000));
        const opts: TListFuturesCandlesticksOpt = {
            'from': from,
            'to': to,
            'interval': interval
        };
        const {body: candlesticks} = await futuresApi.listFuturesCandlesticks(settle, contracts[0].name || '', opts);
        futuresCandlesticksData = mergeCandleSticks(futuresCandlesticksData, candlesticks);
        saveData(futuresCandlesticksData);

        lastTimestamp += chunkTime;
    }
    console.log('Total candlesticks', futuresCandlesticksData.length);



    //analyze
    type ResultAnalyzedData = {
        extremumIndexes: number[]
    }
    const windowSizes = [4 * 12, 16 * 12, 64 * 12, 256 * 12]; //4 hours, 16 hours, ~2,5 day, ~10 days
    const windowsSizeToData = new Map<number, ResultAnalyzedData>();
    for (let ws of windowSizes) {
        windowsSizeToData.set(ws, {extremumIndexes: []});
    }

    for (let currentIndex= 0; currentIndex <  futuresCandlesticksData.length; currentIndex++) {
        for (let windowSize of windowSizes) {
            const data = windowsSizeToData.get(windowSize);
            if (!data) {
                continue;
            }
            if (currentIndex < windowSize) {
                continue;
            }
            if (data.extremumIndexes.length === 0) {
                //empty array, starting to fill with first 2 items
                let minIndex = findMinMaxCandleIndex(futuresCandlesticksData, currentIndex - windowSize, currentIndex, true);
                let maxIndex = findMinMaxCandleIndex(futuresCandlesticksData, currentIndex - windowSize, currentIndex, false);
                if (minIndex < maxIndex) {
                    data.extremumIndexes.push(minIndex, maxIndex);
                } else {
                    data.extremumIndexes.push(maxIndex, minIndex);
                }
            } else {
                const prevIndex1 = data.extremumIndexes[data.extremumIndexes.length - 1];
                const prevIndex2 = data.extremumIndexes[data.extremumIndexes.length - 2];
                if (!futuresCandlesticksData[prevIndex1] || !futuresCandlesticksData[prevIndex2]) {
                    throw Error(`Out of bounds ${prevIndex1} ${prevIndex2} ${futuresCandlesticksData.length}`);
                }

                // @ts-ignore
                let searchNextMin = futuresCandlesticksData[prevIndex2].l < futuresCandlesticksData[prevIndex1].l
                if (prevIndex2 < currentIndex - windowSize) {
                    const nextLocalExtremumIndex = findMinMaxCandleIndex(futuresCandlesticksData, prevIndex1 + 1, currentIndex, searchNextMin);
                    data.extremumIndexes.push(nextLocalExtremumIndex);
                } else {
                    data.extremumIndexes[data.extremumIndexes.length - 1] = findMinMaxCandleIndex(futuresCandlesticksData, prevIndex1, currentIndex, !searchNextMin);
                }
            }
        }
    }
    console.log(windowsSizeToData);

    const {save: saveDataAnalysis} = createJSONFileManager(`${cacheFilename}@analysis`);
    saveDataAnalysis(Object.fromEntries(windowsSizeToData));
})();
