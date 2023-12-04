import { writeFile, readFileSync } from 'node:fs';
import {ApiClient, FuturesApi, FuturesCandlestick} from 'gate-api';
import {writeFileSync} from "fs";

const interval = "5m";
const startBackFrom = 365 * 24 * 60 * 60; //1 year
const chunkTime = 5 * 24 * 60 * 60; //5 days

type TListFuturesCandlesticksOpt = {
    from?: number;
    to?: number;
    limit?: number;
    interval?: '10s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '7d' | '1w' | '30d';
}

const loadCandleStickCachedData = (cacheFileName: string) => {
    let futuresCandlesticksData: FuturesCandlestick[] = [];
    try {
        const fileData = readFileSync(cacheFileName).toString();
        futuresCandlesticksData = JSON.parse(fileData);
    } catch (e) {
        throw e;
    }
    return futuresCandlesticksData;
}

const getCurrentTimestamp = () => {
    return Math.round(Date.now() / 1000);
}

(async () => {
    const pair = 'BTC_USDT';

    const client = new ApiClient();

    const futuresApi = new FuturesApi(client);
    const settle = "usdt"; // 'btc' | 'usdt' | 'usd' | Settle currency

    const {body: contracts} = await futuresApi.listFuturesContracts(settle);
    console.log(contracts.length);

    console.log('contract', contracts[0]);

    const cacheFileName = `./cache/gateio-${contracts[0].name}@${interval}`;
    const futuresCandlesticksData = loadCandleStickCachedData(cacheFileName);


    let lastTimestamp = futuresCandlesticksData.length > 0 ?
        futuresCandlesticksData[futuresCandlesticksData.length - 1].t || 0 :
        getCurrentTimestamp() - startBackFrom;

    console.log(futuresCandlesticksData[futuresCandlesticksData.length - 1]);

    console.log('last candle time', new Date(lastTimestamp * 1000));

    while (lastTimestamp - chunkTime < getCurrentTimestamp()) {
        const from = lastTimestamp + 1;
        const to = lastTimestamp + chunkTime;
        console.log('getting from to', new Date(from * 1000), new Date(to * 1000));
        const opts: TListFuturesCandlesticksOpt = {
            'from': from,
            'to': to,
            'interval': interval
        };
        const {body: candlesticks} = await futuresApi.listFuturesCandlesticks(settle, contracts[0].name || '', opts);
        futuresCandlesticksData.push(...candlesticks);
        writeFileSync(cacheFileName, JSON.stringify(futuresCandlesticksData));

        lastTimestamp += chunkTime;
    }
    console.log(futuresCandlesticksData.length);


})();
