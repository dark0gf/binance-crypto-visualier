import type { NextApiRequest, NextApiResponse } from 'next';
import {createJSONFileManager, gateioInterval, gateioSourceName, generateFileName} from "@/app/services/utils";
import {FuturesCandlestick} from "gate-api";

type ResponseData = {
    message: string
}

export async function GET(req: NextApiRequest) {
    const url = new URL(req.url || '');
    const searchParams = new URLSearchParams(url.search)
    const contract = searchParams.get('contract') || '';

    const candlesFilename = generateFileName(gateioSourceName, contract, gateioInterval, false);
    const resultFilename = generateFileName(gateioSourceName, contract, gateioInterval, true)
    const {load: loadData} = createJSONFileManager<FuturesCandlestick[]>(candlesFilename);
    const {load: loadDataAnalysis} = createJSONFileManager(resultFilename);

    return Response.json({candles: loadData(), result: loadDataAnalysis()});
}

