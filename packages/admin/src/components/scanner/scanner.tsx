import React, { useEffect, useState } from 'react';

export const Scanner: FC = () => {
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
    });

    return (
        <center>
            {origin && (
                <iframe
                    src={`${origin}/scanner/`}
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
