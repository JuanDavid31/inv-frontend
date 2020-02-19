import { TestBed } from '@angular/core/testing';

import { NodoService } from './nodo.service';

describe('NodoService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NodoService = TestBed.get(NodoService);
    expect(service).toBeTruthy();
  });
});
