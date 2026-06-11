import { CheckOutlined, StopOutlined } from '@ant-design/icons';
import { useMemo } from 'react';

const CheckMark = ({ checked }: { checked: boolean }) => {
    const style = useMemo(
        () => ({
            color: checked ? 'green' : undefined
        }),
        [checked]
    );
    return <CheckOutlined style={style} />;
};

const StopMark = ({ checked }: { checked: boolean }) => {
    const style = useMemo(
        () => ({
            color: checked ? 'red' : undefined
        }),
        [checked]
    );
    return <StopOutlined style={style} />;
};

export const ListBooleanPositive = ({ value }: { value: boolean }) => {
    return value ? <CheckMark checked={value} /> : null;
};

export const ListBooleanNegative = ({ value }: { value: boolean }) => {
    return value ? <StopMark checked={value} /> : null;
};
