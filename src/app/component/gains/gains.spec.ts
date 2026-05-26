import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gains } from './gains';

describe('Gains', () => {
  let component: Gains;
  let fixture: ComponentFixture<Gains>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gains]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Gains);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
