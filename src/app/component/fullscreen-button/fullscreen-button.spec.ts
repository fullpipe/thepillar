import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullscreenButton } from './fullscreen-button';

describe('FullscreenButton', () => {
  let component: FullscreenButton;
  let fixture: ComponentFixture<FullscreenButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FullscreenButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FullscreenButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
