import { TestBed } from '@angular/core/testing';

import { JoinGuard } from './join.guard';

describe('JoinGuard', () => {
  let guard: JoinGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(JoinGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
