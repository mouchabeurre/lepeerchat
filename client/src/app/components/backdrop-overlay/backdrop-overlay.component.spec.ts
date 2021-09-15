import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackdropOverlayComponent } from './backdrop-overlay.component';

describe('BackdropOverlayComponent', () => {
  let component: BackdropOverlayComponent;
  let fixture: ComponentFixture<BackdropOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BackdropOverlayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BackdropOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
