import {DependencyList, EffectCallback, useEffect} from "react";

// useEffect(effect: EffectCallback, deps?: DependencyList): void;

export const useAsyncEffect = (effect: () => Promise<any>, deps?: DependencyList) => {
    useEffect(() => {
        (async () => {await effect()})();
    }, deps);
}
