import { TestBed } from '@angular/core/testing';

import { InvitacionService } from './invitacion.service';

describe('InvitacionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: InvitacionService = TestBed.get(InvitacionService);
    expect(service).toBeTruthy();
  });
});
