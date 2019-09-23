import { TestBed, async, inject } from '@angular/core/testing';

import { PrivadoGuard } from './privado.guard';

describe('PrivadoGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PrivadoGuard]
    });
  });

  it('should ...', inject([PrivadoGuard], (guard: PrivadoGuard) => {
    expect(guard).toBeTruthy();
  }));
});
