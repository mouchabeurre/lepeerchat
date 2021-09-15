import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MediaControllerComponent } from './media-controller.component';

describe('MediaViewerComponent', () => {
  let component: MediaControllerComponent;
  let fixture: ComponentFixture<MediaControllerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MediaControllerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MediaControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
