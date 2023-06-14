import React, { useState } from 'react';

import css from './scan-simulator.module.css';

const options = [
    { label: 'Artem', value: 'abcfd1e5' },
    { label: 'no exists', value: 'qwerty1234' },
    { label: 'gr b 1', value: 'sd12' },
    { label: 'gr b 2', value: 'asasd23' },
    { label: 'gr empty', value: 'emptier' }
];

export const ScanSimulator: React.FC<{
    withSelection?: boolean;
    setScanResult: (scanResult: string) => void;
}> = ({ setScanResult, withSelection }) => {
    const [input, setInput] = useState('');

    return (
        <div className={css.scanSimulatorBlock}>
            {withSelection && (
                <select defaultValue={''} onChange={(e) => setInput(e.target.value)}>
                    <option hidden value=''>
                        выбери qr...
                    </option>
                    {options.map(({ label, value }, index) => (
                        <option key={index} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            )}
            <input value={input} placeholder={'введи qr...'} onChange={(e) => setInput(e.target.value)} />
            <button className={css.scan} onClick={() => setScanResult(input)}>
                Сканировать
            </button>
        </div>
    );
};

ScanSimulator.defaultProps = {
    withSelection: false
};
