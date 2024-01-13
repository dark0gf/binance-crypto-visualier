import {ApiClient, FuturesApi} from "gate-api";

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

