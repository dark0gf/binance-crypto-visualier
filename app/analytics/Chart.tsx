import Plotly from "plotly.js";
import React from "react";
import {useAsyncEffect} from "@/app/services/hooks";
import axios from "axios";
import {FuturesCandlestick} from "gate-api";
import {ResultGateAnalyzedData} from "@/app/types/analysis";
import {roundTo4Decimals} from "@/app/services/utils";

const layout = {
    // dragmode: 'zoom',
    margin: {
        r: 200,
        t: 40,
        b: 40,
        l: 40
    },
    // showlegend: false,
    xaxis: {
        // autorange: true,
        type: 'date'
    },
    yaxis: {
        // autorange: true,
        type: 'linear'
    }
};



export default function Chart() {
    useAsyncEffect(async () => {
        // const resContracts = await axios.get('/api/analytics/listContracts');
        // const contract = re
        // sContracts.data.contracts[0]
        const contract = 'ETH_USDT';
        console.log(contract);

        const resAnalytics = await axios.get<{candles: FuturesCandlestick[], result: {[key: string]: ResultGateAnalyzedData}}>(`/api/analytics/result?contract=${contract}`);
        console.log(resAnalytics.data);
        const candles = resAnalytics.data.candles;
        const tradeHigh: any = {
            x: [],
            y: [],
            mode: 'lines',
        };
        const tradeLow: any = {
            x: [],
            y: [],
            mode: 'lines',
        };

        for (let i in candles) {
            // if (parseInt(i) < candles.length - 1000) {
            //     continue;
            // }
            const candle = candles[i];
            // traceCandles.x.push((candle.t || 0) * 1000);
            // traceCandles.open.push(candle.o);
            // traceCandles.close.push(candle.c);
            // traceCandles.low.push(candle.l);
            // traceCandles.high.push(candle.h);
            tradeHigh.x.push((candle.t || 0) * 1000);
            tradeHigh.y.push(candle.h);
            tradeLow.x.push((candle.t || 0) * 1000);
            tradeLow.y.push(candle.l);
        }


        const tracesResults = [];
        for (let i in resAnalytics.data.result) {
            const result = resAnalytics.data.result[i];

            const traceResult: any = {
                x: [],
                y: [],
                text: [],
                mode: 'markers',
                marker: {
                    size: 10
                },
                name: i,
            };

            for (let e of result.extremumIndexes) {
                traceResult.text.push(`Change: ${roundTo4Decimals(e.change)}, Percentile: ${roundTo4Decimals(e.percentile)}`);
                traceResult.x.push((candles[e.i].t || 0) * 1000);
                if (e.isMax) {
                    traceResult.y.push(candles[e.i].h);
                } else {
                    traceResult.y.push(candles[e.i].l);
                }

            }
            tracesResults.push(traceResult);
        }

        const config = {responsive: true};
        // @ts-ignore
        Plotly.newPlot('ploty-container', [tradeHigh, tradeLow, ...tracesResults], layout, config);

    }, []);

    return (<div id="ploty-container">
        {/*// @ts-ignore*/}
        {/*<Plot*/}
        {/*    data={data}*/}
        {/*    layout={layout}*/}
        {/*    config={{responsive: true}}*/}
        {/*/>*/}
    </div>)
}
