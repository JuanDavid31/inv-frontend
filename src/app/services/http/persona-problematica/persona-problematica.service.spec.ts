import { TestBed } from '@angular/core/testing';

import { PersonaProblematicaService } from './persona-problematica.service';

describe('PersonaProblematicaService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PersonaProblematicaService = TestBed.get(PersonaProblematicaService);
    expect(service).toBeTruthy();
  });
});
