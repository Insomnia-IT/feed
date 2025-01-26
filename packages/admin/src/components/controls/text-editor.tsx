import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface IProps {
    value?: string;
    onChange?(value: string): void;
    theme?: 'snow' | 'bubble';
    readOnly?: boolean;
}

export const TextEditor: React.FC<IProps> = ({ value, onChange, theme = 'snow', readOnly = false }) => {
    return <ReactQuill theme={theme} value={value} onChange={onChange} readOnly={readOnly} />;
};
