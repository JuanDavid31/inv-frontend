import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FaseEscritosComponent } from './fase-escritos.component';

describe('FaseEscritosComponent', () => {
  let component: FaseEscritosComponent;
  let fixture: ComponentFixture<FaseEscritosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FaseEscritosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FaseEscritosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
