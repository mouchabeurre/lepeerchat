import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomManagerComponent } from './room-manager.component';

describe('RoomManagerComponent', () => {
  let component: RoomManagerComponent;
  let fixture: ComponentFixture<RoomManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoomManagerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});