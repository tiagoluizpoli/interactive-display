import type { PresentationRepository } from '../../../application';
import type { Presentation } from '../../../domain';
import fs from 'node:fs';
import path from 'node:path';

export class JsonPresentationRepository implements PresentationRepository {
  constructor(private readonly jsonPath: string) { }
  getPresentationByCode(code: string): Promise<Presentation | undefined> {
    // Implement the logic to get a presentation by its code
    // Use the readFile method to get the data from the JSON file
    // Find the presentation with the matching code and return it

    const presentations = this.readFile();

    console.log('presentations', presentations);
    const presentation = presentations.find((presentation) => presentation.code === code);

    if (!presentation) {
      return Promise.resolve(undefined);
    }

    console.log('infra presentation', presentation);

    return Promise.resolve(presentation);
  }

  create(presentation: Presentation): Promise<void> {
    // Implement the logic to create a new presentation
    // Use the readFile method to get the data from the JSON file
    // Add the new presentation to the array and write it back to the file

    const presentations = this.readFile();
    presentations.push(presentation);
    fs.writeFileSync(this.jsonPath, JSON.stringify(presentations, null, 2));

    return Promise.resolve();
  }

  private readFile() {
    // Implement the logic to read the JSON file from jsonPath
    // ensure the file exists, if not, create it with an empty array
    // If the file exists, read its content and parse it as JSON
    // and return the parsed JSON data.

    try {
      // Check if the file exists
      if (!fs.existsSync(this.jsonPath)) {
        // Create the directory if it doesn't exist
        const dir = path.dirname(this.jsonPath);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Create the file with an empty array
        fs.writeFileSync(this.jsonPath, JSON.stringify([], null, 2));
        return [];
      }

      // Read and parse the file
      const fileContent = fs.readFileSync(this.jsonPath, 'utf-8');
      return JSON.parse(fileContent) as Presentation[];
    } catch (error) {
      console.error(`Error reading JSON file: ${error}`);
      return [];
    }
  }
}
