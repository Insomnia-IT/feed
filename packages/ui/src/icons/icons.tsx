import { CheckOutlined, StopOutlined } from '@ant-design/icons';
import { useMemo } from 'react';

export const CheckMark: FC<{
    checked: boolean;
}> = ({ checked }) => {
    const style = useMemo(
        () => ({
            color: checked ? 'green' : undefined
        }),
        [checked]
    );
    return <CheckOutlined style={style} />;
};

export const StopMark: FC<{
    checked: boolean;
}> = ({ checked }) => {
    const style = useMemo(
        () => ({
            color: checked ? 'red' : undefined
        }),
        [checked]
    );
    return <StopOutlined style={style} />;
};

export const ListBooleanPositive: FC<{
    value: boolean;
}> = ({ value }) => {
    return value ? <CheckMark checked={value} /> : null;
};

export const ListBooleanNegative: FC<{
    value: boolean;
}> = ({ value }) => {
    return value ? <StopMark checked={value} /> : null;
};
