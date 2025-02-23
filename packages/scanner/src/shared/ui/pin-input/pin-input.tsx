import React, { memo, useRef, useState } from 'react';

import { Input } from '~/shared/ui/input/input';
import { removeNonDigits } from '~/shared/lib/utils';

import css from './pin-input.module.css';

interface PinInputProps {
    onChange?: (string) => void;
    error?: string | null;
}

export const PinInput = memo(function PinInput(props: PinInputProps): React.ReactElement {
    const { error, onChange } = props;

    const [pin, setPin] = useState('');
    const [focus, setFocus] = useState<boolean>(false);

    const mainInput = useRef<null | HTMLInputElement>(null);

    const handleChangeInput = (e) => {
        const value = removeNonDigits(e.currentTarget.value).slice(0, 4);
        setPin(value);
        if (onChange) {
            onChange(value);
        }
    };

    const handleKeyDown = (e) => {
        if ([37, 38, 39, 40].includes(e.keyCode)) {
            e.preventDefault();
        }
    };

    const handleFocus = (_e): void => {
        if (mainInput.current instanceof HTMLInputElement) {
            mainInput.current.focus();
        }
    };

    return (
        <div className={css.pinInputWrapper}>
            <div className={css.container}>
                <Input
                    className={css.mainInput}
                    value={pin}
                    onChange={handleChangeInput}
                    ref={mainInput}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        setFocus(true);
                    }}
                    onBlur={() => {
                        setFocus(false);
                    }}
                    type={'number'}
                />
                <Input
                    tabIndex={-1}
                    className={css.pinInput}
                    value={pin?.[0] || ''}
                    readOnly
                    focus={focus}
                    onFocus={handleFocus}
                    type='number'
                    error={!!error}
                />
                <Input
                    tabIndex={-1}
                    className={css.pinInput}
                    value={pin?.[1] || ''}
                    readOnly
                    focus={focus}
                    onFocus={handleFocus}
                    type='number'
                    error={!!error}
                />
                <Input
                    tabIndex={-1}
                    className={css.pinInput}
                    value={pin?.[2] || ''}
                    readOnly
                    focus={focus}
                    onFocus={handleFocus}
                    type='number'
                    error={!!error}
                />
                <Input
                    tabIndex={-1}
                    className={css.pinInput}
                    value={pin?.[3] || ''}
                    readOnly
                    focus={focus}
                    onFocus={handleFocus}
                    type='number'
                    error={!!error}
                />
            </div>
            {!!error && <p className={css.errorText}>{error}</p>}
        </div>
    );
});
