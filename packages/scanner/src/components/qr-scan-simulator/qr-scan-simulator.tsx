import React, { useState } from 'react';

import css from './qr-scan-simulator.module.css';

const options = [
    { label: 'Артем Новиков', value: 'abcfd1e5' },
    { label: 'не существует', value: 'qwerty1234' },
    { label: 'Артур', value: '960e4452d6e34747a95b076cc3c22770' },
    { label: 'Театр', value: 'e4baa6e988b140c2be74797727be7180' }
];

export const ScanSimulator: React.FC<{
    withSelection?: boolean;
    setScanResult: (scanResult: string) => void;
}> = ({ setScanResult, withSelection = false }) => {
    const [input, setInput] = useState('e4baa6e988b140c2be74797727be7180');

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
            <button onClick={() => setScanResult(input)}>Сканировать</button>
        </div>
    );
};
