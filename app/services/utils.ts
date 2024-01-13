import {readFileSync} from "node:fs";
import {writeFileSync} from "fs";

export const gateioSourceName = 'gateio';
export const gateioInterval = "5m";

export const createJSONFileManager = <T>(fileName: string) => {
    return {
        load: (): T => {
            let data;
            try {
                const fileData = readFileSync(fileName).toString();
                data = JSON.parse(fileData);
            } catch (e) {
            }
            return data;
        },
        save: (data: T) => {
            writeFileSync(fileName, JSON.stringify(data));
        }
    }
}

export const generateFileName = (sourceName: string, contractName: string, interval: string, analysisResult: boolean) => {
    const name = `./cache/${sourceName}-${contractName}@${interval}`;
    return analysisResult ? name + '@analysis' : name;
}
