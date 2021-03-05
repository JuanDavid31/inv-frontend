import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FaseGrupalComponent } from './fase-grupal.component';

describe('FaseGrupalComponent', () => {
  let component: FaseGrupalComponent;
  let fixture: ComponentFixture<FaseGrupalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FaseGrupalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FaseGrupalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
