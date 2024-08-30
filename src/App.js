import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

const initialApartmentData = {
    1: { history: [], previousReadings: [], lastInputs: {} },
    2: { history: [], previousReadings: [], lastInputs: {} },
    3: { history: [], previousReadings: [], lastInputs: {} },
    4: { history: [], previousReadings: [], lastInputs: {} },
    5: { history: [], previousReadings: [], lastInputs: {} },
    6: { history: [], previousReadings: [], lastInputs: {} },
    7: { history: [], previousReadings: [], lastInputs: {} },
};

function App() {
    const [apartment, setApartment] = useState('1');
    const [currentReading, setCurrentReading] = useState('');
    const [previousReading, setPreviousReading] = useState('');
    const [costPerKwh, setCostPerKwh] = useState('');
    const [apartmentData, setApartmentData] = useState(initialApartmentData);
    const [result, setResult] = useState('');

    useEffect(() => {
        // Load data from localStorage
        const loadedData = {};
        for (let i = 1; i <= 7; i++) {
            const data = localStorage.getItem(`apartment${i}Data`);
            if (data) {
                loadedData[i] = JSON.parse(data);
            } else {
                loadedData[i] = initialApartmentData[i];
            }
        }
        setApartmentData(loadedData);
    }, []);

    useEffect(() => {
        // Save data to localStorage
        Object.keys(apartmentData).forEach(key => {
            localStorage.setItem(`apartment${key}Data`, JSON.stringify(apartmentData[key]));
        });
    }, [apartmentData]);

    const handleCalculate = () => {
        const current = parseFloat(currentReading);
        const previous = parseFloat(previousReading);
        const cost = parseFloat(costPerKwh);

        if (isNaN(current) || isNaN(previous) || isNaN(cost)) {
            setResult('Please enter valid numbers for all fields.');
            return;
        }
        if (current <= previous) {
            setResult('Current reading must be greater than previous reading.');
            return;
        }
        if (cost < 0) {
            setResult('Cost per kWh must be non-negative.');
            return;
        }

        if (apartmentData[apartment].previousReadings.includes(current)) {
            setResult('This current reading has already been used for this apartment. Please enter a different value.');
            return;
        }

        const totalReading = current - previous;
        const totalCost = totalReading * cost;
        const resultText = 
            `Apartment ${apartment} - Total Energy Consumption: ${totalReading.toFixed(2)} kWh\n` +
            `Total Cost: $${totalCost.toFixed(2)}`;

        setResult(resultText);

        setApartmentData(prevData => {
            const updatedData = { ...prevData };
            updatedData[apartment].previousReadings.push(current);
            updatedData[apartment].history.push(resultText);
            updatedData[apartment].lastInputs = { currentReading, previousReading, costPerKwh };
            return updatedData;
        });
    };

    const handleGenerateExcel = () => {
        const data = apartmentData[apartment];
        const workbook = XLSX.utils.book_new();

        // History Sheet
        const historySheet = XLSX.utils.json_to_sheet(data.history.map((result, index) => ({
            Computation: `Computation ${index + 1}`,
            Result: result
        })));
        XLSX.utils.book_append_sheet(workbook, historySheet, `Apartment ${apartment} History`);

        // Previous Readings Sheet
        const readingsSheet = XLSX.utils.json_to_sheet(data.previousReadings.map((reading, index) => ({
            ReadingIndex: index + 1,
            PreviousReading: reading
        })));
        XLSX.utils.book_append_sheet(workbook, readingsSheet, `Apartment ${apartment} Readings`);

        // Last Inputs Sheet
        const inputsSheet = XLSX.utils.json_to_sheet([{
            CurrentReading: data.lastInputs.currentReading || '',
            PreviousReading: data.lastInputs.previousReading || '',
            CostPerKwh: data.lastInputs.costPerKwh || ''
        }]);
        XLSX.utils.book_append_sheet(workbook, inputsSheet, `Apartment ${apartment} Last Inputs`);

        XLSX.writeFile(workbook, `Apartment_${apartment}_Data.xlsx`);
    };

    const handleApartmentChange = (event) => {
        setApartment(event.target.value);
        const inputs = apartmentData[event.target.value].lastInputs;
        setCurrentReading(inputs.currentReading || '');
        setPreviousReading(inputs.previousReading || '');
        setCostPerKwh(inputs.costPerKwh || '');
    };

    const handleClearHistory = () => {
        setApartmentData(prevData => {
            const updatedData = { ...prevData };
            updatedData[apartment].history = [];
            updatedData[apartment].previousReadings = [];
            return updatedData;
        });
    };

    return (
        <div className="App">
            <header>
                <h1>Energy Consumption Calculator</h1>
            </header>
            <main>
                <section id="calculator">
                    <h2>Calculate Energy Consumption and Cost</h2>
                    <form id="energyCalcForm">
                        <label htmlFor="apartmentSelect">Select Apartment:</label>
                        <select id="apartmentSelect" value={apartment} onChange={handleApartmentChange}>
                            {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                <option key={num} value={num}>Apartment {num}</option>
                            ))}
                        </select>

                        <label htmlFor="currentReading">Current Reading (kWh):</label>
                        <input
                            type="number"
                            id="currentReading"
                            value={currentReading}
                            onChange={e => setCurrentReading(e.target.value)}
                            step="0.01"
                            required
                        />

                        <label htmlFor="previousReading">Previous Reading (kWh):</label>
                        <input
                            type="number"
                            id="previousReading"
                            value={previousReading}
                            onChange={e => setPreviousReading(e.target.value)}
                            step="0.01"
                            required
                        />

                        <label htmlFor="costPerKwh">Cost per kWh ($):</label>
                        <input
                            type="number"
                            id="costPerKwh"
                            value={costPerKwh}
                            onChange={e => setCostPerKwh(e.target.value)}
                            step="0.01"
                            required
                        />

                        <button type="button" onClick={handleCalculate}>Calculate</button>
                        <button type="button" onClick={handleGenerateExcel}>Generate Excel File</button>
                        <button type="button" onClick={handleClearHistory}>Clear History</button>
                    </form>

                    <h3>Results:</h3>
                    <p id="result">{result}</p>

                    <h3>History:</h3>
                    <ul>
                        {apartmentData[apartment].history.map((result, index) => (
                            <li key={index}>{`Computation ${index + 1}: ${result}`}</li>
                        ))}
                    </ul>
                </section>
            </main>
           
        </div>
    );
}

export default App;
