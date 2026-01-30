
export interface IBrowserOptions {
    headless?: boolean;
    slowMo?: number;
    showDebug?: boolean;
    defaultTimeoutMs?: number;
    navigationTimeoutMs?: number;
}


export interface BrowserPaths {
    chromium: {
        windows: string[];
        linux: string[];
        darwin: string[];
    };
    firefox: {
        windows: string[];
        linux: string[];
        darwin: string[];
    };
    webkit: {
        windows: string[];
        linux: string[];
        darwin: string[];
    };
}

export interface IScreenshotOptions {
    fullPage?: boolean;
    path?: string;
}
