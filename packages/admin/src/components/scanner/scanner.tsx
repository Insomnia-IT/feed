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
                    style={{ height: '80vh', width: '40vh', border: '15px solid black', borderRadius: '15px' }}
                />
            )}
        </center>
    );
};
