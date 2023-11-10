import {depth} from './binace';
export const generateAggregatedDepth = async (symbol: string, aggregateBy: number, levelsCount: number): Promise<Array<[number, number]>> => {
    const result: Array<[number, number]> = [];
    const depthData = await depth(symbol, 1000);
    const asks = depthData.result.asks;
    const firstAsk = asks[0];
    const lastPrice = parseFloat(firstAsk[0]);
    const lastVolume = parseFloat(firstAsk[1]);
    console.log(depthData.result.asks);
    for (const ask of depthData.result.asks) {

    }

    return result;
}

