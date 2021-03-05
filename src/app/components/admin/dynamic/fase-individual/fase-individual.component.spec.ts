import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FaseIndividualComponent } from './fase-individual.component';

describe('FaseIndividualComponent', () => {
  let component: FaseIndividualComponent;
  let fixture: ComponentFixture<FaseIndividualComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FaseIndividualComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FaseIndividualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
