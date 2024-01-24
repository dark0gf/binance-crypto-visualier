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


//{<contractName>: {<windowSize>: {change, percentile}}]}
export type TResultGateTotalAndLastCandle = {
    [key: string]: {
        [key: string]: {
            change: number;
            percentile: number;
        }
    }
}
