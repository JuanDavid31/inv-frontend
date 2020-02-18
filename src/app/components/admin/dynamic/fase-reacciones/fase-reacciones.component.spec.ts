import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FaseReaccionesComponent } from './fase-reacciones.component';

describe('FaseReaccionesComponent', () => {
  let component: FaseReaccionesComponent;
  let fixture: ComponentFixture<FaseReaccionesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FaseReaccionesComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FaseReaccionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
