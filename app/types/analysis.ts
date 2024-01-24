export type ResultGateAnalyzedData = {
    extremumIndexes: {isMax: boolean, i: number, change: number, percentile: number}[];
    highChange: number[];
    lowChange: number[];
};


//{<contractName>: {<windowSize>: {change, percentile}}]}
export type ResultGateTotalAndLastCandle = {
    [key: string]: {
        [key: string]: {
            change: number;
            percentile: number;
        }
    }
}
