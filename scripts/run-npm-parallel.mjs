import { spawn } from 'node:child_process';

const scriptNames = process.argv.slice(2);

if (scriptNames.length === 0) {
    console.error('Usage: node scripts/run-npm-parallel.mjs <script> [script...]');
    process.exitCode = 1;
} else if (!process.env.npm_execpath) {
    console.error('This script must be started through an npm script.');
    process.exitCode = 1;
} else {
    const children = scriptNames.map((scriptName) =>
        spawn(process.execPath, [process.env.npm_execpath, 'run', scriptName], {
            stdio: 'inherit',
            windowsHide: true
        })
    );

    let stopping = false;

    const stopChildren = () => {
        if (stopping) {
            return;
        }

        stopping = true;
        for (const child of children) {
            if (child.exitCode === null && child.signalCode === null) {
                child.kill();
            }
        }
    };

    for (const signal of ['SIGINT', 'SIGTERM']) {
        process.on(signal, stopChildren);
    }

    for (const child of children) {
        child.on('error', (error) => {
            console.error(error);
            process.exitCode = 1;
            stopChildren();
        });

        child.on('exit', (code, signal) => {
            if (!stopping && (code !== 0 || signal)) {
                process.exitCode = code ?? 1;
                stopChildren();
            }
        });
    }
}
