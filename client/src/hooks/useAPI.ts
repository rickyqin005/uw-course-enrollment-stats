import { useState, useEffect } from "react";

export default function useAPI<T>(path: string, queryParams, initialValue: T, callback: (data: any) => T, dependencies: any) {
    const [data, setData] = useState<T>(initialValue);
    const [dataIsLoaded, setDataIsLoaded] = useState(false);
    useEffect(() => {
        setDataIsLoaded(false);
        const fullURL = `${process.env.REACT_APP_SERVER_URL}${path}?params=${JSON.stringify(queryParams)}`;
        console.log(`fetching ${fullURL}`);
        fetch(fullURL, {
            method: "GET",
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then(data => {
            setData(callback(data));
            setDataIsLoaded(true);
        })
        .catch(error => console.log(error));
    }, dependencies);

    return { data, dataIsLoaded };
}
