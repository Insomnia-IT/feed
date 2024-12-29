import ReactDOM from 'react-dom/client';
// import ReactDOM from 'react-dom';
// import {StrictMode} from 'react';
import './index.css';

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import App from './app/app';
import reportWebVitals from './reportWebVitals';

/*mport 'react-hot-loader';
import {hot} from 'react-hot-loader/root';

import React from 'react';
import ReactDOM from 'react-dom';
// ...
import {App} from './app';
// ...
const HotApp = hot(App);
// ...
ReactDOM.render(<HotApp/>, document.getElementById('root'));*/

//@ts-ignore
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const dev = process.env.NODE_ENV !== 'production';
root.render(
    <App/>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
if (dev) {
    serviceWorkerRegistration.unregister();
} else {
    serviceWorkerRegistration.register();
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
