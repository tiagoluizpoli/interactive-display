import type { PresentationRepository } from '../../../application';
import type { Presentation } from '../../../domain';
import fs from 'node:fs';

import { JsonDbFile } from './json-db-file';
export class JsonPresentationRepository implements PresentationRepository {
  private jsonDbFile: JsonDbFile;
  constructor(private readonly jsonPath: string) {
    this.jsonDbFile = new JsonDbFile(jsonPath);
  }
  getPresentationByCode(code: string): Promise<Presentation | undefined> {
    const db = this.jsonDbFile.readFile();

    const presentation = db.presentations.find((presentation) => presentation.code === code);

    if (!presentation) {
      return Promise.resolve(undefined);
    }

    return Promise.resolve(presentation);
  }

  create(presentation: Presentation): Promise<void> {
    const db = this.jsonDbFile.readFile();
    db.presentations.push(presentation);
    fs.writeFileSync(this.jsonPath, JSON.stringify(db, null, 2));

    return Promise.resolve();
  }

  setCurrentPresentation(currentPresentation: Presentation | null): Promise<void> {
    const db = this.jsonDbFile.readFile();

    db.currentPresentation = currentPresentation;

    fs.writeFileSync(this.jsonPath, JSON.stringify(db, null, 2));

    return Promise.resolve();
  }

  getCurrentPresentation(): Promise<Presentation | undefined> {
    const db = this.jsonDbFile.readFile();
    const currentPresentation = db.currentPresentation;
    if (!currentPresentation) {
      return Promise.resolve(undefined);
    }

    return Promise.resolve(currentPresentation);
  }

  getDisplayEnabled(): Promise<boolean> {
    const db = this.jsonDbFile.readFile();
    const displayEnabled = db.displayEnabled;

    return Promise.resolve(displayEnabled);
  }

  setDisplayEnabled(displayEnabled: boolean): Promise<void> {
    const db = this.jsonDbFile.readFile();
    db.displayEnabled = displayEnabled;

    fs.writeFileSync(this.jsonPath, JSON.stringify(db, null, 2));

    return Promise.resolve();
  }
}
