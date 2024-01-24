"use client"
import React, {useEffect, useState} from 'react';

export default function Analysis() {
    const [Statistics, setStatistics] = useState<any>();

    useEffect(() => {
        (async () => {
            const {default: Statistics} = await import('./Statistics');
            setStatistics(<Statistics />);
        })();

    }, []);

    return (
        <main className="h-full text-black">
            {Statistics}
        </main>
    )
}
