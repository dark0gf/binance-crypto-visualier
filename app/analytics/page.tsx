"use client"
import React, {useEffect, useState} from 'react';

export default function Analysis() {
    const [Chart, setChart] = useState<any>();

    useEffect(() => {
        (async () => {
            const {default: Chart} = await import('./Chart');
            setChart(<Chart />);
        })();

    }, []);

    return (
        <main className="h-full text-black">
            {Chart}
        </main>
    )
}
