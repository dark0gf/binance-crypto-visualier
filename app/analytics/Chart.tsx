import {useAsyncEffect} from "@/app/services/hooks";
import {FuturesCandlestick} from "gate-api";
import {TExtremum, TResultGateAnalyzedData} from "@/app/types/analysis";
import {roundTo4Decimals} from "@/app/services/utils";
import Plotly from "plotly.js";
import React from "react";
import axios from "axios";

const plotyContainerId = 'ploty-container';

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




export function Chart(props: {contract?: string}) {
    useAsyncEffect(async () => {
        Plotly.purge(plotyContainerId);

        const contract = props.contract;
        console.log(contract);

        const resAnalytics = await axios.get<{candles: FuturesCandlestick[], result: {[key: string]: TResultGateAnalyzedData}}>(`/api/analytics/result?contract=${contract}`);
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
            const candle = candles[i];
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

            let prevExtremum: TExtremum | undefined;
            for (let e of result.extremumIndexes) {
                let distance = prevExtremum ? (e.i - prevExtremum.i) : 'None';
                traceResult.text.push(`Change: ${roundTo4Decimals(e.change)}, Distance: ${distance}, Percentile: ${roundTo4Decimals(e.percentile)}`);
                traceResult.x.push((candles[e.i].t || 0) * 1000);
                if (e.isMax) {
                    traceResult.y.push(candles[e.i].h);
                } else {
                    traceResult.y.push(candles[e.i].l);
                }
                prevExtremum = e;
            }
            tracesResults.push(traceResult);
        }

        const config = {responsive: true};
        Plotly.purge(plotyContainerId);
        // @ts-ignore
        Plotly.newPlot(plotyContainerId, [tradeHigh, tradeLow, ...tracesResults], layout, config);

    }, [props.contract]);

    return (<div id={plotyContainerId}>
    </div>);
}
