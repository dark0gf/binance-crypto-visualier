import type { NextApiRequest, NextApiResponse } from 'next';
import {gateioInterval, gateioSourceName} from "@/app/services/utils";
import {FuturesCandlestick} from "gate-api";
import {createJSONFileManager, generateFileName, generateTotalFileName} from "@/app/services/utilsIO";
import {TResultGateTotalAndLastCandle} from "@/app/types/analysis";

export async function GET(req: NextApiRequest) {
    const {load: loadTotalAndLast} = createJSONFileManager<TResultGateTotalAndLastCandle>(generateTotalFileName(gateioSourceName, gateioInterval));

    return Response.json(loadTotalAndLast());
}

