import { v4 as uuidv4 } from 'uuid';

let ws: WebSocket;
const requests: any = {};

interface IDepthResponse {
    id: string;
    result: {
        asks: Array<[string, string]>;
        bids: Array<[string, string]>;
    }
}

export const createWSConnection = async () => {
    const promise = new Promise((resolve => {
        ws = new WebSocket('wss://ws-api.binance.com:443/ws-api/v3');

        ws.onopen = function () {
            resolve(undefined);
        };
    }));

    ws.onmessage = (msg) => {
        try {
            const message = JSON.parse(msg.data);
            const p = requests[message.id];
            if (!p) {
                console.error('Not valid id', message);
            }
            p.resolve(message);
        } catch (e) {
            console.error('Parse message failed', e);
        }
    };

    return promise;
}

const sendMessage = async (data: any) => {
    const uuid = uuidv4();
    const promise = new Promise((resolve, reject) => {
        requests[uuid] = {resolve, reject};
    });
    const preparedData = {...data, id: uuid};
    ws.send(JSON.stringify(preparedData));
    return promise;
}
export const depth = async (symbol: string, limit: number) => {
    return sendMessage({
        "method": "depth",
        "params": {
            "symbol": symbol,
            "limit": limit
        }
    });
}

export const ping = async () => {
    const data = await depth('BTCUSDT', 1000);
    console.log(data);
}
