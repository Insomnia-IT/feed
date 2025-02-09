declare module '*.css' {
    const content: { [className: string]: string };

    export default content;
}

declare module '*.svg' {
    import type React from 'react';
    const content: React.VFC<React.SVGProps<SVGSVGElement>>;
    export default content;
}

declare module '*.svg?noSvgo' {
    const content: React.VFC<React.SVGProps<SVGSVGElement>>;
    export default content;
}

declare module '*.css?CSSModulesDisable' {
    const content: string;
    export default content;
}

declare module '*.svg?raw' {
    const content: string;
    export default content;
}

declare module '*.png' {
    const value: any;

    export = value;
}

declare module '*.jpg' {
    const value: any;

    export = value;
}

declare namespace NodeJS {
    interface Process {
        browser: boolean;
    }
}

declare namespace React {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        xmlns?: string;
    }
}
