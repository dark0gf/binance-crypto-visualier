export const gateioSourceName = 'gateio';
export const gateioInterval = "5m";

export const roundTo4Decimals = (v: number | undefined) => {
    if (typeof v !== 'number') {
        return 'N';
    }
    return Math.round(v * 10000) / 10000;
}




