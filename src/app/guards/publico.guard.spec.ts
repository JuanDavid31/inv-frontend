import { TestBed, async, inject } from '@angular/core/testing';

import { PublicoGuard } from './publico.guard';

describe('PublicoGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PublicoGuard]
    });
  });

  it('should ...', inject([PublicoGuard], (guard: PublicoGuard) => {
    expect(guard).toBeTruthy();
  }));
});
