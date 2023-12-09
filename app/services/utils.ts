import {readFileSync} from "node:fs";
import {writeFileSync} from "fs";


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
