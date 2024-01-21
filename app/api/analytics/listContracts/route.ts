import fs from 'node:fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';
import {gateioInterval, gateioSourceName, generateFileName} from "@/app/services/utils";
import {getContracts} from "@/app/services/gateioFutures";

let cacheContractsResult: any;

export async function GET(req: NextApiRequest) {
    if (cacheContractsResult) {
        return Response.json({contracts:  cacheContractsResult});
    }
    const contracts = await getContracts();

    const result: string[] = [];
    for (let contract of contracts) {
        const cacheFilename = generateFileName(gateioSourceName, contract.name || '', gateioInterval, false);
        const cacheFilenameResult = generateFileName(gateioSourceName, contract.name || '', gateioInterval, true);

        let existsCandlesCache = await fs.access(cacheFilename).then(() => true).catch(() => false);
        let existsResultCache = await fs.access(cacheFilenameResult).then(() => true).catch(() => false);
        console.log(cacheFilename, cacheFilenameResult, existsCandlesCache, existsResultCache);
        if (existsCandlesCache && existsResultCache) {
            result.push(contract.name || '');
        }
    }
    cacheContractsResult = result;
    return Response.json({contracts:  result});
}

