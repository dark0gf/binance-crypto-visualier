import {TResultGateTotalAndLastCandle} from "@/app/types/analysis";

export default function ContractStatistics(props: {contract?: string, results?: TResultGateTotalAndLastCandle}) {
    return <div>
        <pre>{JSON.stringify(props.results, undefined, 2)}</pre>
    </div>
}