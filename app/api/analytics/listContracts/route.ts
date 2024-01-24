import fs from 'node:fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';
import {gateioInterval, gateioSourceName} from "@/app/services/utils";
import {getContracts} from "@/app/services/gateioFutures";
import {generateFileName} from "@/app/services/utilsIO";

let cacheContractsResult: any = await (async () => {
    const contracts = await getContracts();

    const result: string[] = [];
    for (let contract of contracts) {
        const cacheFilename = generateFileName(gateioSourceName, contract.name || '', gateioInterval, false);
        const cacheFilenameResult = generateFileName(gateioSourceName, contract.name || '', gateioInterval, true);

        let existsCandlesCache = await fs.access(cacheFilename).then(() => true).catch(() => false);
        let existsResultCache = await fs.access(cacheFilenameResult).then(() => true).catch(() => false);

        if (existsCandlesCache && existsResultCache) {
            result.push(contract.name || '');
        }
    }

    return result;
})();


export async function GET(req: NextApiRequest) {

    return Response.json({contracts:  cacheContractsResult});
}

