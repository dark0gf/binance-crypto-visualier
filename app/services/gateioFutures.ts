import {ApiClient, FuturesApi, FuturesCandlestick} from "gate-api";
export class FuturesCandlestickNumbers extends FuturesCandlestick {
    constructor(candle: FuturesCandlestick) {
        super();
        this.c_n = candle.c ? parseFloat(candle.c) : 0;
        this.h_n = candle.h ? parseFloat(candle.h) : 0;
        this.l_n = candle.l ? parseFloat(candle.l) : 0;
        this.o_n = candle.o ? parseFloat(candle.o) : 0;
        this.sum_n = candle.sum ? parseFloat(candle.sum) : 0;
    }
    'c_n': number;
    'h_n': number;
    'l_n': number;
    'o_n': number;
    'sum_n': number;
}

const client = new ApiClient();

const futuresApiClient = new FuturesApi(client);
const settle = "usdt"; // 'btc' | 'usdt' | 'usd' | Settle currency

export const getFuturesApiClient = () => {
    return futuresApiClient;
}

export const getContracts = async () => {
    const {body: contracts} = await futuresApiClient.listFuturesContracts(settle);
    return contracts;
}

export const getCandlesticks = async (name: string, opts: any) => {
    const {body: candlesticks} = await futuresApiClient.listFuturesCandlesticks(settle, name, opts);
    return candlesticks;
}
