import React, {useState} from "react";
import {useAsyncEffect} from "@/app/services/hooks";
import {Chart} from "@/app/analytics/Chart";
import axios from "axios";
import {TResultGateTotalAndLastCandle} from "@/app/types/analysis";
import SelectSearch from 'react-select-search';
import 'react-select-search/style.css'
import {roundTo4Decimals} from "@/app/services/utils";

export default function Statistics() {
    const [dataResults, setDataResults] = useState<TResultGateTotalAndLastCandle>();
    const [contractName, setContractName] = useState()
    const [windowSizes, setWindowSizes] = useState<string[]>([]);
    const [sortByWindowSize, setSortByWindowSize] = useState('');

    useAsyncEffect(async () => {
        const resTotal = await axios.get<TResultGateTotalAndLastCandle>('/api/analytics/resultTotal');
        console.log(resTotal.data);
        setDataResults(resTotal.data);
        const contractNames = Object.keys(resTotal.data.result);
        const firstContractName = contractNames[0];
        if (firstContractName) {
            const windowSizes = Object.keys(resTotal.data.result[firstContractName])
            setWindowSizes(windowSizes);
            if (windowSizes.length > 0) {
                setSortByWindowSize(windowSizes[0]);
            }
        }
    }, []);

    return (<div>
        Select contract: <SelectSearch
            options={ Object.keys(dataResults?.result ?? []).map((contractName) => ({name: contractName, value: contractName}))}
            onChange={(v) => {
                console.log(v);
                // @ts-ignore TODO: investigate type issue
                setContractName(v);
            }}
            value={contractName}
            search
            placeholder="Select contract"
        />

        <Chart contract={contractName} />
        <div className="m-2">
            Select sort by window size: <SelectSearch
            options={windowSizes.map((ws) => ({name: ws, value: ws}))}
            onChange={(v) => {
                console.log(v);
                // @ts-ignore TODO: investigate type issue
                setSortByWindowSize(v);
            }}
            value={sortByWindowSize}
            placeholder="Select contract"
        />
        </div>
        <div className="flex m-2 text-sm">
            <div className="flex-1">
                <p className="text-4xl">Bull</p>
                <div className={`grid grid-cols-${windowSizes.length + 1} gap-1`}>
                    <div>Contract name (candles count)</div>
                    {windowSizes.map((ws) => <div key={ws}>{ws} change / percentile</div>)}
                    {Object.keys(dataResults?.result ?? [])
                    .filter((contractName) => (dataResults?.result?.[contractName]?.[sortByWindowSize]?.change ?? 0) > 1)
                    .sort((contractNameA, contractNameB) => (
                        (dataResults?.result?.[contractNameB]?.[sortByWindowSize]?.percentile ?? 1) - (dataResults?.result?.[contractNameA]?.[sortByWindowSize]?.percentile ?? 1)
                    ))
                    .map((contractName) => (<>
                        <div key={contractName}>
                            {contractName} ({dataResults?.totalCandles[contractName]})
                        </div>
                        {windowSizes.map(ws => <div key={ws}>
                            {roundTo4Decimals(dataResults?.result?.[contractName]?.[ws]?.change)}/
                            {roundTo4Decimals(dataResults?.result?.[contractName]?.[ws]?.percentile)}
                        </div>)}
                    </>)
                    )}
                </div>
            </div>
            <div className="flex-1">
                <p className="text-4xl">Bear</p>
                <div className={`grid grid-cols-${windowSizes.length + 1} gap-1`}>
                    <div>Contract name (candles count)</div>
                    {windowSizes.map((ws) => <div key={ws}>{ws} change / percentile</div>)}
                    {Object.keys(dataResults?.result ?? [])
                        .filter((contractName) => (dataResults?.result?.[contractName]?.[sortByWindowSize]?.change ?? 0) < 1)
                        .sort((contractNameA, contractNameB) => (
                            (dataResults?.result?.[contractNameA]?.[sortByWindowSize]?.percentile ?? 1) - (dataResults?.result?.[contractNameB]?.[sortByWindowSize]?.percentile ?? 1)
                        ))
                        .map((contractName) => (<>
                                <div key={contractName}>
                                    {contractName} ({dataResults?.totalCandles[contractName]})
                                </div>
                                {windowSizes.map(ws => <div key={ws}>
                                    {roundTo4Decimals(dataResults?.result?.[contractName]?.[ws]?.change)}/
                                    {roundTo4Decimals(dataResults?.result?.[contractName]?.[ws]?.percentile)}
                                </div>)}
                            </>)
                        )}
                </div>
            </div>
        </div>
    </div>);
}
