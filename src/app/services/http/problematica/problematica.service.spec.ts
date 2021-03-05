import { TestBed } from '@angular/core/testing';

import { ProblematicaService } from './problematica.service';

describe('ProblematicaService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProblematicaService = TestBed.get(ProblematicaService);
    expect(service).toBeTruthy();
  });
});
