import React, { useState } from 'react';

import css from './qr-scan-simulator.module.css';

const options = [
    { label: 'Артем Новиков', value: 'abcfd1e5' },
    { label: 'не существует', value: 'qwerty1234' },
    { label: 'Артур', value: '960e4452d6e34747a95b076cc3c22770' }
];

export const ScanSimulator: React.FC<{
    withSelection?: boolean;
    setScanResult: (scanResult: string) => void;
}> = ({ setScanResult, withSelection }) => {
    const [input, setInput] = useState('960e4452d6e34747a95b076cc3c22770');

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
