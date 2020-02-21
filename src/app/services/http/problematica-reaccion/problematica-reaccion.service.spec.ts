import { TestBed } from '@angular/core/testing';

import { ProblematicaReaccionService } from './problematica-reaccion.service';

describe('ProblematicaReaccionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProblematicaReaccionService = TestBed.get(ProblematicaReaccionService);
    expect(service).toBeTruthy();
  });
});
