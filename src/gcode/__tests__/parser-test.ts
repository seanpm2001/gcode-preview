/* eslint-env jest */

import { GCodeCommand, GCodeParser } from "../parser";

test('empty gcode line should be parsed into non-null object', () => {
    const gcode = '';
    const cmd = GCodeParser.parseCommand(gcode);
  
    expect(cmd).not.toBeNull();
});

test('gcode line should be parsed into non-null object', () => {
    const gcode =`G1 X0 Y0 Z1 E1`;
    const cmd = GCodeParser.parseCommand(gcode);
    expect(cmd).not.toBeUndefined();
    expect(cmd).toBeInstanceOf(GCodeCommand);
});

test('The first word should be parsed as the gcode command in lowercase', () => {
    let gcode =`G42`;
    let cmd = GCodeParser.parseCommand(gcode);
    expect(cmd.gcode).not.toBeUndefined();
    expect(cmd.gcode).toEqual('g42');
    expect(cmd.gcode).not.toEqual('G42');

    gcode =`B42`;
    cmd = GCodeParser.parseCommand(gcode);
    expect(cmd.gcode).not.toBeUndefined();
    expect(cmd.gcode).toEqual('b42');
    expect(cmd.gcode).not.toEqual('B42');
});

test('command w/o params has an empty but non-null params object', () => {
    const gcode =`G42`;
    const cmd = GCodeParser.parseCommand(gcode);
    expect(cmd.params).not.toBeUndefined();
    expect(cmd.params).not.toBeNull();
    expect(cmd.params).toBeInstanceOf(Object);
});

test('the gcode command itself should not end up in the params object', () => {
    const gcode =`G42`;
    const cmd = GCodeParser.parseCommand(gcode);
    expect(cmd.params.g).toBeUndefined();
    expect(cmd.params.G).toBeUndefined();
});

test('words after the command should end up in the params object', () => {
    const gcode =`G42 X42`;
    const cmd = GCodeParser.parseCommand(gcode);
    expect(cmd.params.X).toBeUndefined();
    expect(cmd.params.x).toEqual(42);
});

test('invalid words should be ignored', () => {
    const gcode =`G42 42`;
    const cmd = GCodeParser.parseCommand(gcode);
    const keys = Object.keys(cmd.params);
    expect(keys.length).toEqual(0);
});