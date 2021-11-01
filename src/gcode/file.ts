/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
class GCodeFile {
    lines: string[]

    constructor(public file: string) {
        this.lines = file.split('\n');
    }

    getLine(index: number) {
        return this.lines[index];
    }
}

export { GCodeFile }