import fs from 'node:fs';
import path from 'node:path';
import type { Presentation } from '../../../domain';

export interface JsonDbSchema {
  presentations: Presentation[];
  currentPresentation?: Presentation | null;
  displayEnabled: boolean;
}
export class JsonDbFile {
  constructor(private readonly jsonPath: string) {}
  readFile() {
    try {
      // Check if the file exists
      if (!fs.existsSync(this.jsonPath)) {
        // Create the directory if it doesn't exist
        const dir = path.dirname(this.jsonPath);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Create the file with an empty array
        fs.writeFileSync(
          this.jsonPath,
          JSON.stringify(
            {
              presentations: [],
              displayEnabled: false,
              currentPresentation: null,
            } as JsonDbSchema,
            null,
            2,
          ),
        );
      }

      // Read and parse the file
      const fileContent = fs.readFileSync(this.jsonPath, 'utf-8');
      return JSON.parse(fileContent) as JsonDbSchema;
    } catch (error) {
      console.error(`Error reading JSON file: ${error}`);
      throw error;
    }
  }
}
