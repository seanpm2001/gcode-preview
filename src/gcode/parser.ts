export type GCodeParams= Record<string, number>;

export class GCodeCommand {
    constructor(
      public gcode: string, 
      public params: GCodeParams,
      public comment?: string) {}
  }

export class GCodeParser {
    
    /**
     * 
     * @param line The string to be parsed
     * @returns A parsed GCodeCommand
     */
    static parseCommand(line: string): GCodeCommand {
        const input = line.trim();
        const splitted = input.split(';');
        const cmd = splitted[0];
        const comment = splitted[1]?.trim();
    
        const parts = cmd.split(/ +/g);
        const gcode = parts[0].toLowerCase();
        const params = this.parseParams(parts.slice(1));
        
        return new GCodeCommand(gcode, params, comment);
      }

      private static isAlpha(char : string) : boolean {
        const code = char.charCodeAt(0);
        return (code >= 97 && code <= 122) || (code >= 65 && code <= 90);
      }
    
      private static parseParams(params: string[]): Record<string, number> {
        return params.reduce((acc: Record<string, number>, cur: string) => {
          const key = cur.charAt(0).toLowerCase();
          if (this.isAlpha(key))
            acc[key] = parseFloat(cur.slice(1));
          return acc;
        }, {});
      }
}

