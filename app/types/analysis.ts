export type TExtremum = {
    isMax: boolean;
    i: number;
    change: number;
    percentile: number;
}

export type TResultGateAnalyzedData = {
    extremumIndexes: TExtremum[];
    highChange: number[];
    lowChange: number[];
};


//result: {<contractName>: {<windowSize>: {change, percentile}}]}
//totalCandles: {<contractName>: <number of total candles analized>}
export type TResultGateTotalAndLastCandle = {
    totalCandles: {
        [key: string]: number
    };
    result: {
        [key: string]: {
            [key: string]: {
                change: number;
                percentile: number;
            }
        }
    }
}
