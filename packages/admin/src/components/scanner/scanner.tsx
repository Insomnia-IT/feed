import { SCANNER_URL } from 'const';

export const Scanner = () => {
    return (
        <center>
            {SCANNER_URL && (
                <iframe
                    src={SCANNER_URL}
                    title="Scanner"
                    style={{
                        height: 'min(95vh,1024px)',
                        width: 'min(50vh, 512px)',
                        border: '15px solid black',
                        borderRadius: '15px'
                    }}
                />
            )}
        </center>
    );
};
