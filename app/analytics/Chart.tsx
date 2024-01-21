import Plotly from "plotly.js";
import React from "react";
import {useAsyncEffect} from "@/app/services/hooks";
import axios from "axios";
import {FuturesCandlestick} from "gate-api";
const trace1 = {
    x: ['2017-01-04', '2017-01-05', '2017-01-06', '2017-01-09', '2017-01-10', '2017-01-11', '2017-01-12', '2017-01-13', '2017-01-17', '2017-01-18', '2017-01-19', '2017-01-20', '2017-01-23', '2017-01-24', '2017-01-25', '2017-01-26', '2017-01-27', '2017-01-30', '2017-01-31', '2017-02-01', '2017-02-02', '2017-02-03', '2017-02-06', '2017-02-07', '2017-02-08', '2017-02-09', '2017-02-10', '2017-02-13', '2017-02-14', '2017-02-15'],
    close: [116.019997, 116.610001, 117.910004, 118.989998, 119.110001, 119.75, 119.25, 119.040001, 120, 119.989998, 119.779999, 120, 120.080002, 119.970001, 121.879997, 121.940002, 121.949997, 121.629997, 121.349998, 128.75, 128.529999, 129.080002, 130.289993, 131.529999, 132.039993, 132.419998, 132.119995, 133.289993, 135.020004, 135.509995],
    high: [116.510002, 116.860001, 118.160004, 119.43, 119.379997, 119.93, 119.300003, 119.620003, 120.239998, 120.5, 120.089996, 120.449997, 120.809998, 120.099998, 122.099998, 122.440002, 122.349998, 121.629997, 121.389999, 130.490005, 129.389999, 129.190002, 130.5, 132.089996, 132.220001, 132.449997, 132.940002, 133.820007, 135.089996, 136.270004],
    low: [115.75, 115.809998, 116.470001, 117.940002, 118.300003, 118.599998, 118.209999, 118.809998, 118.220001, 119.709999, 119.370003, 119.730003, 119.769997, 119.5, 120.279999, 121.599998, 121.599998, 120.660004, 120.620003, 127.010002, 127.779999, 128.160004, 128.899994, 130.449997, 131.220001, 131.119995, 132.050003, 132.75, 133.25, 134.619995],
    open: [115.849998, 115.919998, 116.779999, 117.949997, 118.769997, 118.739998, 118.900002, 119.110001, 118.339996, 120, 119.400002, 120.449997, 120, 119.550003, 120.419998, 121.669998, 122.139999, 120.93, 121.150002, 127.029999, 127.980003, 128.309998, 129.130005, 130.539993, 131.350006, 131.649994, 132.460007, 133.080002, 133.470001, 135.520004],
    type: 'candlestick',
    xaxis: 'x',
    yaxis: 'y'
};

const data = [trace1];

const layout = {
    // dragmode: 'zoom',
    margin: {
        r: 100,
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
        const resContracts = await axios.get('/api/analytics/listContracts');
        const contract = resContracts.data.contracts[0]
        console.log(contract);

        const resAnalytics = await axios.get(`/api/analytics/result?contract=${contract}`);
        console.log(resAnalytics.data);
        const candles: FuturesCandlestick[] = resAnalytics.data.candles;
        // const traceCandles: any = {
        //     x: [],
        //     open: [],
        //     close: [],
        //     low: [],
        //     high: [],
        //     type: 'candlestixck',
        //     xaxis: 'x',
        //     yaxis: 'y'
        // };
        //var trace2 = {
        //   x: [2, 3, 4, 5],
        //   y: [16, 5, 11, 9],
        //   mode: 'lines',
        //   name: 'Lines'
        // };
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
                mode: 'markers',
                marker: {
                    size: 10
                },
                name: i,
            };
            for (let e of result.extremumIndexes) {
                    // if (!candles[e]) {
                    //     console.warn('index', e, 'does not exists, window size ', i);
                    //     continue;
                    // }
                traceResult.x.push((candles[e].t || 0) * 1000);
                traceResult.y.push(candles[e].o);
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
