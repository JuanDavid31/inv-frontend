import { TestBed } from '@angular/core/testing';

import { ProblematicaPersonaService } from './problematica-persona.service';

describe('ProblematicaPersonaService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProblematicaPersonaService = TestBed.get(ProblematicaPersonaService);
    expect(service).toBeTruthy();
  });
});
