import { writeFile, readFileSync } from 'node:fs';
import {ApiClient, FuturesApi, FuturesCandlestick} from 'gate-api';
import {writeFileSync} from "fs";

const interval = "5m";
const startBackFrom = 365 * 24 * 60 * 60;

type TListFuturesCandlesticksOpt = {
    from?: number;
    to?: number;
    limit?: number;
    interval?: '10s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '7d' | '1w' | '30d';
}

const loadCandleStickCachedData = (cacheFileName: string) => {
    let futuresCandlesticksData: FuturesCandlestick[] = [];
    try {
        let data = JSON.parse(readFileSync(cacheFileName).toString());
    } catch (e) {}
    return futuresCandlesticksData;
}

(async () => {
    const pair = 'BTC_USDT';

    const client = new ApiClient();

    const futuresApi = new FuturesApi(client);
    const settle = "usdt"; // 'btc' | 'usdt' | 'usd' | Settle currency

    const {body: contracts} = await futuresApi.listFuturesContracts(settle);
    console.log(contracts.length);


    const opts: TListFuturesCandlesticksOpt = {
        // 'from': 1546905600, // number | Start time of candlesticks, formatted in Unix timestamp in seconds. Default to`to - 100 * interval` if not specified
        // 'to': 1546935600, // number | End time of candlesticks, formatted in Unix timestamp in seconds. Default to current time
        'interval': interval // '10s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '7d' | '1w' | '30d' | Interval time between data points. Note that `1w` means natual week(Mon-Sun), while `7d` means every 7d since unix 0.  Note that 30d means 1 natual month, not 30 days
    };
    console.log('contract', contracts[0]);
    const {body: candlesticks} = await futuresApi.listFuturesCandlesticks(settle, contracts[0].name || '', opts);

    console.log('candle', candlesticks[0]);

    const cacheFileName = `./cache/gateio-${contracts[0].name}@${interval}`;
    const futuresCandlesticksData = loadCandleStickCachedData(cacheFileName);

    let lastTimestamp = futuresCandlesticksData.length > 0 ? futuresCandlesticksData[futuresCandlesticksData.length - 1] : Math.round(Date.now() / 1000) - startBackFrom;
    console.log(futuresCandlesticksData);



    writeFileSync(cacheFileName, JSON.stringify(futuresCandlesticksData));


// const contract = pair; // string | Futures contract
// const opts: TListFuturesCandlesticksOpt = {
//     'from': 1546905600, // number | Start time of candlesticks, formatted in Unix timestamp in seconds. Default to`to - 100 * interval` if not specified
//     'to': 1546935600, // number | End time of candlesticks, formatted in Unix timestamp in seconds. Default to current time
//     'interval': "5m" // '10s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '7d' | '1w' | '30d' | Interval time between data points. Note that `1w` means natual week(Mon-Sun), while `7d` means every 7d since unix 0.  Note that 30d means 1 natual month, not 30 days
// };
// api.listFuturesCandlesticks(settle, contract, opts)
//     .then(value => console.log('API called successfully. Returned data: ', value.body),
//         error => console.error(error));



})();
