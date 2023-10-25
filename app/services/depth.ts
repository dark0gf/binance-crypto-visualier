import {depth} from './binace';
export const generateAggregatedDepth = async (symbol: string, aggregateBy: number, levelsCount: number) => {
    const depthData = await depth(symbol, 1000);
    console.log(depthData);
}

