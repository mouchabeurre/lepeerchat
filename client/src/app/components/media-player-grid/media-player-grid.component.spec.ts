import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaPlayerGridComponent } from './media-player-grid.component';

describe('MediaPlayerGridComponent', () => {
  let component: MediaPlayerGridComponent;
  let fixture: ComponentFixture<MediaPlayerGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MediaPlayerGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MediaPlayerGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
