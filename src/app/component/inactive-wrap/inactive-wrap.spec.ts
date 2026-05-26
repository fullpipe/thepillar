import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InactiveWrap } from './inactive-wrap';

describe('InactiveWrap', () => {
  let component: InactiveWrap;
  let fixture: ComponentFixture<InactiveWrap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InactiveWrap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InactiveWrap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
