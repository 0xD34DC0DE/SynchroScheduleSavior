import chalk, {BackgroundColorName, ForegroundColorName} from "chalk";

class ColoredIdentifier {
    constructor(
        public readonly id: string,
        public readonly fgColor?: ForegroundColorName,
        public readonly bgColor?: BackgroundColorName
    ) {
    }

    public toString() {
        let instance = chalk;
        if (this.fgColor) instance = instance[this.fgColor];
        if (this.bgColor) instance = instance[this.bgColor];
        return instance(this.id);
    }
}

type LogLevel = "INFO" | "WARN" | "ERROR" | "LOG" | "DEBUG";

type LogLevelIdentifiers = { [key in LogLevel]: ColoredIdentifier };

const LogLevelColors: LogLevelIdentifiers = {
    INFO: new ColoredIdentifier("INFO", "white", "bgBlue"),
    WARN: new ColoredIdentifier("WARN", "black", "bgYellow"),
    ERROR: new ColoredIdentifier("ERROR", "white", "bgRed"),
    LOG: new ColoredIdentifier("LOG", "white", "bgGreen"),
    DEBUG: new ColoredIdentifier("DEBUG", "white", "bgMagenta")
};

class NamespaceConsoleLogger {
    private readonly _namespace: LoggerNamespace;

    constructor(namespace: LoggerNamespace);
    constructor(name: string, fgColor?: ForegroundColorName, bgColor?: BackgroundColorName);
    constructor(name: string | LoggerNamespace, fgColor?: ForegroundColorName, bgColor?: BackgroundColorName) {
        if (name instanceof LoggerNamespace) {
            this._namespace = name;
        } else {
            this._namespace = new LoggerNamespace(new ColoredIdentifier(name, fgColor, bgColor));
        }
    }

    public log(message: string, ...args: any[]) {
        console.log(`${LogLevelColors.LOG} ${this._namespace}`, message, ...args);
    }

    public info(message: string, ...args: any[]) {
        console.info(`${LogLevelColors.INFO} ${this._namespace}`, message, ...args);
    }

    public warn(message: string, ...args: any[]) {
        console.warn(`${LogLevelColors.WARN} ${this._namespace}`, message, ...args);
    }

    public error(message: string, ...args: any[]) {
        console.error(`${LogLevelColors.ERROR} ${this._namespace}`, message, ...args);
    }

    public debug(message: string, ...args: any[]) {
        console.debug(`${LogLevelColors.DEBUG} ${this._namespace}`, message, ...args);
    }

    public extend(subName: string, fgColor?: ForegroundColorName, bgColor?: BackgroundColorName) {
        return new NamespaceConsoleLogger(this._namespace.extend(subName, fgColor, bgColor));
    }
}

class LoggerNamespace {
    private readonly _identifiers: ColoredIdentifier[];

    constructor(identifier: ColoredIdentifier);
    constructor(identifiers: ColoredIdentifier[]);
    constructor(identifiers: ColoredIdentifier | ColoredIdentifier[]) {
        this._identifiers = Array.isArray(identifiers) ? identifiers : [identifiers];
    }

    public extend(subName: string, fgColor?: ForegroundColorName, bgColor?: BackgroundColorName) {
        const newIdentifier = new ColoredIdentifier(subName, fgColor, bgColor);
        return new LoggerNamespace([...this._identifiers, newIdentifier]);
    }

    public toString() {
        return this._identifiers.join(":");
    }
}

export type {
    ForegroundColorName as LoggerFgColor,
    BackgroundColorName as LoggerBgColor
};
export {NamespaceConsoleLogger, LoggerNamespace, ColoredIdentifier};