import { TestBed } from '@angular/core/testing';

import { ProblematicaEscritoService } from './problematica-escrito.service';

describe('ProblematicaEscritoService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProblematicaEscritoService = TestBed.get(ProblematicaEscritoService);
    expect(service).toBeTruthy();
  });
});
