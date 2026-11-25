// AirportAutocomplete.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function AirportAutocomplete({ placeholder, onSelect, isMulti = false, value }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    useEffect(() => {
        const searchTerms = isMulti ? query.split(",") : [query];
        const lastWord = searchTerms.pop().trim();

        if (!lastWord) {
            setResults([]);
            return;
        }
        axios.get(`http://127.0.0.1:8000/airports/search?query=${lastWord}`)
            .then((res) => setResults(res.data))
            .catch((err) => console.log(err));

    }, [query, isMulti]);
    const handleSelect = (airport) => {
        onSelect(airport);
        const cityWithCode = `${airport.city} (${airport.airport_code})`;

        if (isMulti) {
            setQuery((prev) => {
                const parts = prev.split(",").map(p => p.trim());
                parts.pop();
                return [...parts, cityWithCode].join(", ") + ", ";
            });
        } else {
            setQuery(cityWithCode);
        }
        setResults([]);
    };
    useEffect(() => {
        if (!value || (isMulti && value.length === 0)) {
            setQuery("");
            return;
        }

        if (isMulti) {
            const formatted = value
                .map((a) => `${a.city} (${a.airport_code})`)
                .join(", ");

            setQuery(formatted ? formatted + ", " : "");
        } else {
            setQuery(`${value.city} (${value.airport_code})`);
        }
    }, [value, isMulti]);

    return (
        <div className="autocomplete-container">
            <input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="autocomplete-input"
            />

            {results.length > 0 && (
                <ul className="autocomplete-dropdown">
                    {results.map((airport) => (
                        <li
                            key={airport.airport_code}
                            onClick={() => handleSelect(airport)}
                            className="autocomplete-item"
                        >
                            <strong>{airport.city}</strong> ({airport.airport_code})
                            <br />
                            <small>
                                {airport.airport_name} - {airport.country}
                            </small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}