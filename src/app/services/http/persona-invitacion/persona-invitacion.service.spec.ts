import { TestBed } from '@angular/core/testing';

import { PersonaInvitacionService } from './persona-invitacion.service';

describe('PersonaInvitacionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PersonaInvitacionService = TestBed.get(PersonaInvitacionService);
    expect(service).toBeTruthy();
  });
});
