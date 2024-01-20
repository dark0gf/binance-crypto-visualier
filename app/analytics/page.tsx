"use client"
import React, {useEffect, useState} from 'react';

export default function Analysis() {
    const [Chart, setChart] = useState<any>();

    useEffect(() => {
        (async () => {
            const {default: Chart} = await import('./Chart');

            const TestChart = function TestChart() {
                return <>Hi!</>
            }
            console.log(<Chart />);
            console.log(<TestChart />);
            setChart(<Chart />);
        })();

    }, []);

    return (
        <main className="h-full text-black">
            {Chart}
        </main>
    )
}
