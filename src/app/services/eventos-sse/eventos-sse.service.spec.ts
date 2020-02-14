import { TestBed } from '@angular/core/testing';

import { EventosSseService } from './eventos-sse.service';

describe('EventosSseService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EventosSseService = TestBed.get(EventosSseService);
    expect(service).toBeTruthy();
  });
});
