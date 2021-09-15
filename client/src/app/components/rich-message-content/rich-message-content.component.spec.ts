import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RichMessageContentComponent } from './rich-message-content.component';

describe('RichMessageContentComponent', () => {
  let component: RichMessageContentComponent;
  let fixture: ComponentFixture<RichMessageContentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RichMessageContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RichMessageContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
