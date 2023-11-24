import {ApiClient, FuturesApi} from 'gate-api';

type TListFuturesCandlesticksOpt = {
    from?: number;
    to?: number;
    limit?: number;
    interval?: '10s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '7d' | '1w' | '30d';
}

(async () => {
    const pair = 'BTC_USDT';

    const client = new ApiClient();
// uncomment the next line to change base path
// client.basePath = "https://some-other-host"

    const futuresApi = new FuturesApi(client);
    const settle = "usdt"; // 'btc' | 'usdt' | 'usd' | Settle currency

    const {body: contracts} = await futuresApi.listFuturesContracts(settle);
    console.log(contracts.length);


    const opts: TListFuturesCandlesticksOpt = {
        // 'from': 1546905600, // number | Start time of candlesticks, formatted in Unix timestamp in seconds. Default to`to - 100 * interval` if not specified
        // 'to': 1546935600, // number | End time of candlesticks, formatted in Unix timestamp in seconds. Default to current time
        'interval': "5m" // '10s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '7d' | '1w' | '30d' | Interval time between data points. Note that `1w` means natual week(Mon-Sun), while `7d` means every 7d since unix 0.  Note that 30d means 1 natual month, not 30 days
    };
    await futuresApi.listFuturesCandlesticks(settle, contracts[0].name || '', opts)
        .then(value => console.log('API called successfully. Returned data: ', value.body),
            error => console.error(error));



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
