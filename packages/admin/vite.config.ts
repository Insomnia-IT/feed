import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            utils: path.resolve(__dirname, './src/utils.ts'),
            auth: path.resolve(__dirname, './src/auth.ts'),
            authProvider: path.resolve(__dirname, './src/authProvider.ts'),
            const: path.resolve(__dirname, './src/const.ts'),
            components: path.resolve(__dirname, './src/components'),
            interfaces: path.resolve(__dirname, './src/interfaces'),
            shared: path.resolve(__dirname, './src/shared'),
            acl: path.resolve(__dirname, './src/acl.ts'),
            dataProvider: path.resolve(__dirname, './src/dataProvider.ts'),
            assets: path.resolve(__dirname, './src/assets')
        }
    },
    server: {
        port: 3002
    }
});

// Может быть полезно, удалить после успешного деплоя

// build: {
//     rollupOptions: {
//         output: {
//             assetFileNames: ({ name }) => {
//                 if (/\.(gif|jpe?g|png|svg)$/.test(name || "")) {
//                     return "assets/images/[name][extname]";
//                 }

//                 if (/\.ttf$/.test(name || "")) {
//                     return "assets/fonts/[name][extname]";
//                 }

//                 // https://rollupjs.org/guide/en/#outputassetfilenames
//                 return "assets/[name]-[hash][extname]";
//             },

//                 manualChunks(id) {
//                 if (id.includes("node_modules")) {
//                     return "vendor";
//                 }
//             },
//             dir: "./dist",
//         },
//     },
// },
// css: {
//     modules: {
//         localsConvention: "camelCaseOnly",
//     },
// },
