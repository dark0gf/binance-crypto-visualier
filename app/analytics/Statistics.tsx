import React, {useState} from "react";
import {useAsyncEffect} from "@/app/services/hooks";
import {Chart} from "@/app/analytics/Chart";
import axios from "axios";
import {TResultGateTotalAndLastCandle} from "@/app/types/analysis";
import SelectSearch from 'react-select-search';
import 'react-select-search/style.css'
import {roundTo4Decimals} from "@/app/services/utils";

export default function Statistics() {
    const [result, setResult] = useState<TResultGateTotalAndLastCandle>();
    const [contractName, setContractName] = useState()
    const [windowSizes, setWindowSizes] = useState<string[]>([]);
    const [sortByWindowSize, setSortByWindowSize] = useState('');

    useAsyncEffect(async () => {
        const resTotal = await axios.get<TResultGateTotalAndLastCandle>('/api/analytics/resultTotal');
        console.log(resTotal.data);
        setResult(resTotal.data);
        const contractNames = Object.keys(resTotal.data);
        const firstContractName = contractNames[0];
        if (firstContractName) {
            const windowSizes = Object.keys(resTotal.data[firstContractName])
            setWindowSizes(windowSizes);
            if (windowSizes.length > 0) {
                setSortByWindowSize(windowSizes[0]);
            }
        }
    }, []);

    return (<div>
        Select contract: <SelectSearch
            options={ Object.keys(result ?? []).map((contractName) => ({name: contractName, value: contractName}))}
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
        <div className="flex m-2">
            <div className="flex-1">
                <p className="text-4xl">Bull</p>
                <div className={`grid grid-cols-${windowSizes.length + 1} gap-2`}>
                    <div>Contract name</div>
                    {windowSizes.map((ws) => <div key={ws}>{ws} change / percentile</div>)}
                    {Object.keys(result ?? [])
                    .filter((contractName) => (result?.[contractName]?.[sortByWindowSize]?.change ?? 0) > 1)
                    .sort((contractNameA, contractNameB) => (
                        (result?.[contractNameB]?.[sortByWindowSize]?.percentile || 1) - (result?.[contractNameA]?.[sortByWindowSize]?.percentile || 1)
                    ))
                    .map((contractName) => (<>
                        <div key={contractName}>
                            {contractName}
                        </div>
                        {windowSizes.map(ws => <div key={ws}>
                            {roundTo4Decimals(result?.[contractName]?.[ws]?.change)}/
                            {roundTo4Decimals(result?.[contractName]?.[ws]?.percentile)}
                        </div>)}
                    </>)
                    )}
                </div>
            </div>
            <div className="flex-1">
                <p className="text-4xl">Bear</p>
                <div className={`grid grid-cols-${windowSizes.length + 1} gap-2`}>
                    <div>Contract name</div>
                    {windowSizes.map((ws) => <div key={ws}>{ws} change / percentile</div>)}
                    {Object.keys(result ?? [])
                        .filter((contractName) => (result?.[contractName]?.[sortByWindowSize]?.change ?? 0) < 1)
                        .sort((contractNameA, contractNameB) => (
                            (result?.[contractNameA]?.[sortByWindowSize]?.percentile || 1) - (result?.[contractNameB]?.[sortByWindowSize]?.percentile || 1)
                        ))
                        .map((contractName) => (<>
                                <div key={contractName}>
                                    {contractName}
                                </div>
                                {windowSizes.map(ws => <div key={ws}>
                                    {roundTo4Decimals(result?.[contractName]?.[ws]?.change)}/
                                    {roundTo4Decimals(result?.[contractName]?.[ws]?.percentile)}
                                </div>)}
                            </>)
                        )}
                </div>
            </div>
        </div>
    </div>);
}
