import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CachedRoomsComponent } from './cached-rooms.component';

describe('CachedRoomsComponent', () => {
  let component: CachedRoomsComponent;
  let fixture: ComponentFixture<CachedRoomsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CachedRoomsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CachedRoomsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
