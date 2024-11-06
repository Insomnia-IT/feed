import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import CircularDependencyPlugin from 'circular-dependency-plugin';
import { i18n } from './next-i18next.config.mjs';
import assert from 'assert';

import env from '../core/webpack/env.js';

console.log(process.env.NEW_API_URL_ENV);
assert(process.env.NEW_API_URL_ENV, 'env variables must be set');

// TODO check https://github.com/vercel/next.js/issues/39161

/** @type { import('next').NextConfig } */
const nextConfig = {
    basePath: process.env.ADMIN_BASE_PATH_ENV || '',
    experimental: {
        newNextLinkBehavior: true,
        webpackBuildWorker: true
    },
    i18n: i18n.i18n,
    async headers() {
        return [
            {
                // Apply these headers to all routes in your application.
                source: '/:path*',
                headers: [
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=0'
                    }
                ]
            }
        ];
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
        config.plugins.push(env);

        config.resolve.plugins = [...(config.resolve.plugins || []), new TsconfigPathsPlugin()];

        config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
        config.experiments = { ...config.experiments, asyncWebAssembly: true };

        if (isServer && dev) {
            new CircularDependencyPlugin({
                exclude: /a\.js|node_modules/,
                include: /src/,
                failOnError: true,
                allowAsyncCycles: false,
                cwd: process.cwd()
            });
        }

        if (config.cache) {
            config.cache = Object.freeze({
                type: 'memory'
            });
        }

        return config;
    },
    transpilePackages: ['@feed/ui', '@feed/core', '@feed/api']
};

export default nextConfig;
