import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveRoomPromptComponent } from './leave-room-prompt.component';

describe('LeaveRoomPromptComponent', () => {
  let component: LeaveRoomPromptComponent;
  let fixture: ComponentFixture<LeaveRoomPromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeaveRoomPromptComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeaveRoomPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
