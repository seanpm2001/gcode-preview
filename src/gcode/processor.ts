import { GCodeFile } from './file';
import { GCodeCommand, GCodeParams, GCodeParser } from './parser';

export class GCodeProcessorState {
    x = 0
    y = 0
    z = 0
    e = 0
}

export class GCodeProcessor {
    state = new GCodeProcessorState();
    curIndex = 0;

    constructor(public file: GCodeFile) {

    }

    run() {
        let result;
        do {
            result = this.step();
        } while(result !== false);
    }

    step() {
        if (this.curIndex >= this.file.lines.length) return false;
        
        const line = this.file.getLine(this.curIndex);

        // parse line
        const cmd = GCodeParser.parseCommand(line);

        this.handleCommand(cmd);
        this.curIndex++;
        return this.curIndex;
    }

    handleCommand(cmd: GCodeCommand): void {
        switch(cmd.gcode) {
            case 'g0':
            case 'g1':
                this.state = this.handleG0G1( cmd.params);
                break;
        }
    }

    handleG0G1(params: GCodeParams): GCodeProcessorState {
        const nextState = new GCodeProcessorState();
        
        nextState.x = this.state.x + (params.x ?? 0);
        nextState.y = this.state.y + (params.y ?? 0);
        nextState.z = this.state.z + (params.z ?? 0);
        nextState.e = this.state.e + (params.e ?? 0);

        return nextState;
    }
}
