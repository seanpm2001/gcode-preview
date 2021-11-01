/* eslint-env jest */

import { GCodeFile } from "../file";
import { GCodeCommand, GCodeParser } from "../parser";
import { GCodeProcessor, GCodeProcessorState } from "../processor";

test('initial processor should have a 0 state', () => {
    const gcode = 'G42';
    const file = new GCodeFile(gcode);
    const processor = new GCodeProcessor(file);
    
    expect(processor).toBeInstanceOf(GCodeProcessor);
    expect(processor.state.x).toEqual(0);
    expect(processor.state.y).toEqual(0);
    expect(processor.state.z).toEqual(0);
    expect(processor.state.e).toEqual(0);
});

test('processing an unknown command should not result in a state change', () => {
    const gcode = 'G42 X1 Y2 Z3';
    const file = new GCodeFile(gcode);
    const processor = new GCodeProcessor(file);
    processor.step();

    expect(processor).toBeInstanceOf(GCodeProcessor);
    expect(processor.state).toBeInstanceOf(GCodeProcessorState);
    expect(processor.state.x).toEqual(0);
    expect(processor.state.y).toEqual(0);
    expect(processor.state.z).toEqual(0);
    expect(processor.state.e).toEqual(0);
});

test('processing a G0 or G1 command should move the state', () => {
    const gcode = 'G1 X1 Y2 Z3';
    const file = new GCodeFile(gcode);
    const processor = new GCodeProcessor(file);
    processor.step();
    
    expect(processor).toBeInstanceOf(GCodeProcessor);
    expect(processor.state.x).toEqual(1);
    expect(processor.state.y).toEqual(2);
    expect(processor.state.z).toEqual(3);
    expect(processor.state.e).toEqual(0);
});

test('processing a G0 or G1 command should not influence unused dimensions', () => {
    const gcode = 'G1';
    const file = new GCodeFile(gcode);
    const processor = new GCodeProcessor(file);
    processor.step();
    
    expect(processor).toBeInstanceOf(GCodeProcessor);
    expect(processor.state.x).toEqual(0);
    expect(processor.state.y).toEqual(0);
    expect(processor.state.z).toEqual(0);
    expect(processor.state.e).toEqual(0);
});

test('initially the curIndex should be 0', () => {
    const gcode = 'g42';
    const file = new GCodeFile(gcode);
    const processor = new GCodeProcessor(file);

    expect(processor.curIndex).toEqual(0);
});

test('after a step the index should point to the next line', () => {
    const gcode = 'g42';
    const file = new GCodeFile(gcode);
    const processor = new GCodeProcessor(file);
    const index = processor.step();

    expect(index).toEqual(1);
});

test('attempting to step beyond the length of the input results in false', () => {
    const gcode = 'g42';
    const file = new GCodeFile(gcode);
    const processor = new GCodeProcessor(file);
    processor.step();
    const secondResult = processor.step();
    
    expect(secondResult).toEqual(false)
});

test('attempting to process beyond the length of the input does not update curIndex', () => {
    const gcode = 'g42';
    const file = new GCodeFile(gcode);
    const processor = new GCodeProcessor(file);
    const firstResult = processor.step();
    processor.step();
    
    expect(processor.curIndex).toEqual(firstResult);
});