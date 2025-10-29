import fs from 'node:fs/promises';
import path from 'node:path';
import type { Presentation } from '../../../models';
import type { PresentationRepository } from '../presentation-repository';

export interface JsonDbSchema {
  presentations: Presentation[];
  currentPresentation?: Presentation | null;
  displayEnabled: boolean;
}

export class FilePresentationRepository implements PresentationRepository {
  private db: JsonDbSchema | null = null;

  constructor(private readonly jsonPath: string) {}

  async connect(): Promise<void> {
    await this.initializeDbFile();
    const fileContent = await fs.readFile(this.jsonPath, 'utf-8');
    this.db = JSON.parse(fileContent);
  }

  async getPresentationByCode(code: string): Promise<Presentation | undefined> {
    if (!this.db) {
      await this.connect();
    }
    const presentation = this.db!.presentations.find((p) => p.code === code);
    return presentation;
  }

  async create(presentation: Presentation): Promise<void> {
    if (!this.db) {
      await this.connect();
    }
    this.db!.presentations.push(presentation);
    await fs.writeFile(this.jsonPath, JSON.stringify(this.db, null, 2));
  }

  private async initializeDbFile(): Promise<void> {
    try {
      await fs.access(this.jsonPath);
    } catch {
      const dir = path.dirname(this.jsonPath);
      await fs.mkdir(dir, { recursive: true });
      const initialDb: JsonDbSchema = {
        presentations: [],
        displayEnabled: false,
        currentPresentation: null,
      };
      await fs.writeFile(this.jsonPath, JSON.stringify(initialDb, null, 2));
    }
  }
}
