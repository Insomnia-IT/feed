import React = require('react');
import {Workbox} from 'workbox-window';

declare global {
    type ReactMouseEvent<T = Element, E = NativeMouseEvent> = React.MouseEvent<T, E>;
    type ReactMouseEventHandler<T = Element> = React.MouseEventHandler<T>;
    type ReactKeyboardEvent<T = Element> = React.KeyboardEvent<T>;
    type ReactUIEvent<T = Element, E = NativeUIEvent> = React.UIEvent<T, E>;
    type ReactFocusEvent<T = Element, R = Element> = React.FocusEvent<T, R>;
    type CSSProperties = React.CSSProperties;
    type FC<T = {}> = React.FC<T>;
    type FormEvent<T = Element> = React.FormEvent<T>;
    type ChangeEvent<T = Element> = React.ChangeEvent<T>;
    type ReactNode = React.ReactNode;
    type RefObject<T> = React.RefObject<T>;
    type ElementType<P = any> = React.ElementType<P>;
    type ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> = React.ReactElement<P, T>;
    type ForwardedRef<T> = React.ForwardedRef<T>;
    type ReactChild = React.ReactChild;
    type ComponentType<P = {}> = React.ComponentType<P>;
    type MutableRefObject<T> = React.MutableRefObject<T>;
    type SVGProps<T> = React.SVGProps<T>;

    export type AnyObject<T = unknown, P = string> = Record<P, T>;
    export type PrimitiveValue = string | number | boolean; // number | string | boolean | bigint | symbol | null | undefined
    export type CssModule = Record<string, string>;

    export type SVGIcon = FC<SVGProps<SVGSVGElement>>;

    interface Window {
        workbox: Workbox;
    }
}
