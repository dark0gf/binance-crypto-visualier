import {FuturesCandlestick} from 'gate-api';
import {createJSONFileManager, generateFileName, generateTotalFileName} from "@/app/services/utilsIO";
import {getCandlesticks, getContracts} from "@/app/services/gateioFutures";
import {ResultGateAnalyzedData, ResultGateTotalAndLastCandle} from "@/app/types/analysis";
import {gateioInterval, gateioSourceName} from "@/app/services/utils";

declare class FuturesCandlestickFloat  {
    't'?: number;
    'v'?: number;
    'c'?: string | number;
    'h'?: number;
    'l'?: number;
    'o'?: string;
    'sum'?: string;
    static discriminator: string | undefined;
    static attributeTypeMap: Array<{
        name: string;
        baseName: string;
        type: string;
    }>;
    static getAttributeTypeMap(): {
        name: string;
        baseName: string;
        type: string;
    }[];
}

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

const findMinMaxCandleIndex = (candles: FuturesCandlestickFloat[], startFromIndex: number, toIndex: number, min: boolean): number => {
    let result = startFromIndex;
    for (let i = startFromIndex; i <= toIndex; i++) {
        if (min) {
            // @ts-ignore
            if (candles[i].l < candles[result].l) {
                result = i;
            }
        } else {
            // @ts-ignore
            if (candles[i].h > candles[result].h) {
                result = i;
            }
        }
    }
    return result;
}

const percentileForValue = (sortedArr: number[], val: number) => {
    //search position
    let low = 0,
        high = sortedArr.length;

    while (low < high) {
        let mid = low + high >>> 1;
        if (sortedArr[mid] < val) low = mid + 1;
        else high = mid;
    }

    return low  / sortedArr.length;
}

(async () => {
    //load data from gate.io
    const contracts = await getContracts();
    console.log('Total contracts', contracts.length);
    for (let contract of contracts) {
        if (!contract.name) {
            console.error('Contract name is empty', contract);
            continue;
        }
        console.log('Processing contract', contract.name);
        const cacheFilename = generateFileName(gateioSourceName, contract.name || '', gateioInterval, false);

        const {save: saveData, load: loadData} = createJSONFileManager<FuturesCandlestick[]>(cacheFilename);

        let futuresCandlesticksData = loadData();

        futuresCandlesticksData = futuresCandlesticksData ?? [];


        let lastTimestamp = futuresCandlesticksData.length > 0 ?
            futuresCandlesticksData[futuresCandlesticksData.length - 1].t || 0 :
            getCurrentTimestamp() - startBackFrom;

        console.log('last candle time', new Date(lastTimestamp * 1000));

        let stop = false;
        while (!stop) {
            const from = lastTimestamp;
            let to = lastTimestamp + chunkTime;

            if (to > getCurrentTimestamp()) {
                to = getCurrentTimestamp();
                stop = true;
            }
            console.log('getting from to', new Date(from * 1000), new Date(to * 1000));
            const opts: TListFuturesCandlesticksOpt = {
                'from': from,
                'to': to,
                'interval': gateioInterval
            };

            try {
                const candlesticks = await getCandlesticks(contract.name || '', opts);
                futuresCandlesticksData = mergeCandleSticks(futuresCandlesticksData, candlesticks);
                saveData(futuresCandlesticksData);
            } catch (e) {
                console.error(e);
            }

            lastTimestamp += chunkTime;
        }
        console.log('Total candlesticks', futuresCandlesticksData.length);
        const futuresCandlesticksFloatData: FuturesCandlestickFloat[] = futuresCandlesticksData.map(c => {
            const newCandle = {...c, h: parseFloat(c.h || '0'), l: parseFloat(c.l || '0')};
            return newCandle;
        })



        //analyze
        const windowSizes = [4 * 12, 16 * 12, 64 * 12, 256 * 12]; //4 hours, 16 hours, ~2,5 day, ~10 days
        const windowsSizeToData = new Map<number, ResultGateAnalyzedData>();
        for (let ws of windowSizes) {
            windowsSizeToData.set(ws, {extremumIndexes: [], highChange: [], lowChange: []});
        }

        for (let currentIndex= 0; currentIndex <  futuresCandlesticksFloatData.length; currentIndex++) {
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
                    let minIndex = findMinMaxCandleIndex(futuresCandlesticksFloatData, currentIndex - windowSize, currentIndex, true);
                    let maxIndex = findMinMaxCandleIndex(futuresCandlesticksFloatData, currentIndex - windowSize, currentIndex, false);
                    if (minIndex < maxIndex) {
                        const change = (futuresCandlesticksFloatData[maxIndex].h || 1) / (futuresCandlesticksFloatData[minIndex].l || 1);
                        data.extremumIndexes.push({isMax: false, i: minIndex, change: 0, percentile: -1}, {isMax: true, i: maxIndex, change, percentile: -1});
                    } else {
                        const change = (futuresCandlesticksFloatData[minIndex].l || 1) / (futuresCandlesticksFloatData[maxIndex].h || 1);
                        data.extremumIndexes.push({isMax: true, i: maxIndex, change: 0, percentile: -1}, {isMax: false, i: minIndex, change, percentile: -1});
                    }
                } else {
                    const prevExtremum1 = data.extremumIndexes[data.extremumIndexes.length - 1];
                    const prevExtremum2 = data.extremumIndexes[data.extremumIndexes.length - 2];
                    if (!futuresCandlesticksFloatData[prevExtremum1.i] || !futuresCandlesticksFloatData[prevExtremum2.i]) {
                        throw Error(`Out of bounds ${prevExtremum1.i} ${prevExtremum2.i} ${futuresCandlesticksFloatData.length}`);
                    }

                    // @ts-ignore
                    let isPrevMax = prevExtremum1.isMax;
                    if (prevExtremum2.i < currentIndex - windowSize) {
                        const nextLocalExtremumIndex = findMinMaxCandleIndex(futuresCandlesticksFloatData, prevExtremum1.i + 1, currentIndex, isPrevMax);
                        const nextLocalExtremumCandle = futuresCandlesticksFloatData[nextLocalExtremumIndex];
                        const isMax = !isPrevMax;
                        let change
                        if (isMax) {
                            change = (nextLocalExtremumCandle.h || 1) / (futuresCandlesticksFloatData[prevExtremum1.i].l || 1);
                        } else {
                            change = (nextLocalExtremumCandle.l || 1) / (futuresCandlesticksFloatData[prevExtremum1.i].h || 1)
                        }
                        data.extremumIndexes.push({isMax, i: nextLocalExtremumIndex, change, percentile: -1});
                    } else {
                        let change;
                        if (prevExtremum1.isMax) {
                            change = (futuresCandlesticksFloatData[prevExtremum1.i].h || 1) / (futuresCandlesticksFloatData[prevExtremum2.i].l || 1)
                        } else {
                            change = (futuresCandlesticksFloatData[prevExtremum1.i].l || 1) / (futuresCandlesticksFloatData[prevExtremum2.i].h || 1)
                        }
                        prevExtremum1.i = findMinMaxCandleIndex(futuresCandlesticksFloatData, prevExtremum1.i, currentIndex, !isPrevMax);
                        prevExtremum1.change = change;
                    }
                }
            }
        }

        for (let windowSize of windowSizes) {
            const data = windowsSizeToData.get(windowSize);
            if (!data) {
                continue;
            }

            console.log('Getting low and high change arrays');
            const lowChange: number[] = [];
            const highChange: number[] = [];
            for (let extremum of data.extremumIndexes) {
                if (extremum.change > 1) {
                    highChange.push(extremum.change);
                } else {
                    lowChange.push(extremum.change);
                }
            }
            lowChange.sort((a, b) => a - b);
            highChange.sort((a, b) => a - b);


            console.log('Calculating percentiles for each extremum');
            for (let extremum of data.extremumIndexes) {
                if (extremum.change > 1) {
                    extremum.percentile = percentileForValue(highChange, extremum.change);
                } else {
                    extremum.percentile = percentileForValue(lowChange, extremum.change);
                }
            }
            data.lowChange = lowChange;
            data.highChange = highChange;
        }


        console.log('saving analysis data');

        const {save: saveDataAnalysis} = createJSONFileManager(generateFileName(gateioSourceName, contract.name || '', gateioInterval, true));
        saveDataAnalysis(Object.fromEntries(windowsSizeToData));

        console.log('Preparing total data');
        const {save: saveTotalAndLast, load: loadTotalAndLast} = createJSONFileManager<ResultGateTotalAndLastCandle>(generateTotalFileName(gateioSourceName, gateioInterval));
        let resultTotal = loadTotalAndLast();
        if (!resultTotal) {
            resultTotal = {};
        }

        resultTotal[contract.name] = {};
        const wstdo = Object.fromEntries(windowsSizeToData);
        for (let ws in wstdo) {
            const result = wstdo[ws];
            if (result.extremumIndexes.length < 2) {
                continue;
            }

            //time ------------------------------------------------------------>
            //candles prev2candleExtremum ---> prev1candleExtremum -> lastCandle
            const prev1Extremum = result.extremumIndexes[result.extremumIndexes.length - 1];
            const prev2Extremum = result.extremumIndexes[result.extremumIndexes.length - 2];
            const prev1candleExtremum = futuresCandlesticksFloatData[prev1Extremum.i];
            const prev2candleExtremum = futuresCandlesticksFloatData[prev2Extremum.i];
            const lastCandle = {...futuresCandlesticksFloatData[futuresCandlesticksFloatData.length - 1]};
            if (typeof lastCandle.c === "string") {
                lastCandle.c = parseFloat(lastCandle.c || '0');
            }

            let change;
            let percentile;
            if (prev2Extremum.isMax) {
                if ((lastCandle.c || 0) > (prev2candleExtremum.h || 0)) {
                    // prev2candleExtremum.h = 3.71, prev1candleExtremum.l = 2.13, lastCandle.c = 3.98 (getting change from prev1 to last)
                    change = (lastCandle.c || 1) / (prev1candleExtremum.l || 1);
                    percentile = percentileForValue(result.highChange, change);
                } else {
                    // prev2candleExtremum.h = 3.71, prev1candleExtremum.l = 2.13, lastCandle.c = 3.10 (getting change from prev2 to last)
                    change = (lastCandle.c || 1) / (prev2candleExtremum.h || 1);
                    percentile = percentileForValue(result.lowChange, change);
                }
            } else {
                    // prev2candleExtremum.l = 2.08, prev1candleExtremum.l = 3.64, lastCandle.c = 1.15 (getting change from prev1 to last)
                if ((lastCandle.c || 0) < (prev2candleExtremum.l || 0)) {
                    change = (lastCandle.c || 1) / (prev1candleExtremum.h || 1);
                    percentile = percentileForValue(result.lowChange, change);
                } else {
                    // prev2candleExtremum.l = 2.08, prev1candleExtremum.l = 3.64, lastCandle.c = 3.25 (getting change from prev2 to last)
                    change = (lastCandle.c || 1) / (prev2candleExtremum.l || 1);
                    percentile = percentileForValue(result.highChange, change);
                }
            }
            resultTotal[contract.name][ws] = {change, percentile};

        }

        saveTotalAndLast(resultTotal);
        console.log('done');
    }
})();
