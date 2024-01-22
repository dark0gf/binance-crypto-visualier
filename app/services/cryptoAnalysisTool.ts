import {FuturesCandlestick} from 'gate-api';
import {createJSONFileManager, gateioInterval, gateioSourceName, generateFileName} from "@/app/services/utils";
import {getCandlesticks, getContracts} from "@/app/services/gateioFutures";
import {ResultAnalyzedData} from "@/app/types/analysis";


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
            if (parseFloat(candles[i].l) < parseFloat(candles[result].l)) {
                result = i;
            }
        } else {
            // @ts-ignore
            if (parseFloat(candles[i].h) > parseFloat(candles[result].h)) {
                result = i;
            }
        }
    }
    return result;
}

(async () => {
    //load data from gate.io
    const contracts = await getContracts();
    console.log(contracts.length);

    console.log('contract', contracts[0]);
    const cacheFilename = generateFileName(gateioSourceName, contracts[0].name || '', gateioInterval, false);

    const {save: saveData, load: loadData} = createJSONFileManager<FuturesCandlestick[]>(cacheFilename);

    let futuresCandlesticksData = loadData();

    futuresCandlesticksData = futuresCandlesticksData ?? [];


    let lastTimestamp = futuresCandlesticksData.length > 0 ?
        futuresCandlesticksData[futuresCandlesticksData.length - 1].t || 0 :
        getCurrentTimestamp() - startBackFrom;

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
            'interval': gateioInterval
        };

        const candlesticks = await getCandlesticks(contracts[0].name || '', opts);
        futuresCandlesticksData = mergeCandleSticks(futuresCandlesticksData, candlesticks);
        saveData(futuresCandlesticksData);

        lastTimestamp += chunkTime;
    }
    console.log('Total candlesticks', futuresCandlesticksData.length);



    //analyze
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
                    const change = parseFloat(futuresCandlesticksData[maxIndex].h || '1') / parseFloat(futuresCandlesticksData[minIndex].l || '1');
                    data.extremumIndexes.push({isMax: false, i: minIndex, change: 0}, {isMax: true, i: maxIndex, change});
                } else {
                    const change = parseFloat(futuresCandlesticksData[minIndex].l || '1') / parseFloat(futuresCandlesticksData[maxIndex].h || '1');
                    data.extremumIndexes.push({isMax: true, i: maxIndex, change: 0}, {isMax: false, i: minIndex, change});
                }
            } else {
                const prevExtremum1 = data.extremumIndexes[data.extremumIndexes.length - 1];
                const prevExtremum2 = data.extremumIndexes[data.extremumIndexes.length - 2];
                if (!futuresCandlesticksData[prevExtremum1.i] || !futuresCandlesticksData[prevExtremum2.i]) {
                    throw Error(`Out of bounds ${prevExtremum1.i} ${prevExtremum2.i} ${futuresCandlesticksData.length}`);
                }

                // @ts-ignore
                let isPrevMax = prevExtremum1.isMax;//futuresCandlesticksData[prevIndex2].l < futuresCandlesticksData[prevIndex1].l
                if (prevExtremum2.i < currentIndex - windowSize) {
                    const nextLocalExtremumIndex = findMinMaxCandleIndex(futuresCandlesticksData, prevExtremum1.i + 1, currentIndex, isPrevMax);
                    const nextLocalExtremumCandle = futuresCandlesticksData[nextLocalExtremumIndex];
                    const isMax = !isPrevMax;
                    let change
                    if (isMax) {
                        change = parseFloat(nextLocalExtremumCandle.h || '1') / parseFloat(futuresCandlesticksData[prevExtremum1.i].l || '1')
                    } else {
                        change = parseFloat(nextLocalExtremumCandle.l || '1') / parseFloat(futuresCandlesticksData[prevExtremum1.i].h || '1')
                    }
                    data.extremumIndexes.push({isMax, i: nextLocalExtremumIndex, change});
                } else {
                    let change;
                    if (prevExtremum1.isMax) {
                        change = parseFloat(futuresCandlesticksData[prevExtremum1.i].h || '1') / parseFloat(futuresCandlesticksData[prevExtremum2.i].l || '1')
                    } else {
                        change = parseFloat(futuresCandlesticksData[prevExtremum1.i].l || '1') / parseFloat(futuresCandlesticksData[prevExtremum2.i].h || '1')
                    }
                    prevExtremum1.i = findMinMaxCandleIndex(futuresCandlesticksData, prevExtremum1.i, currentIndex, !isPrevMax);
                    prevExtremum1.change = change;
                }
            }
        }
    }
    console.log(windowsSizeToData);

    const {save: saveDataAnalysis} = createJSONFileManager(generateFileName(gateioSourceName, contracts[0].name || '', gateioInterval, true));
    saveDataAnalysis(Object.fromEntries(windowsSizeToData));
})();
