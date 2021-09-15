import { TestBed } from '@angular/core/testing';

import { ComponentDeactivateGuard } from './component-deactivate.guard';

describe('ComponentDeactivateGuard', () => {
  let guard: ComponentDeactivateGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(ComponentDeactivateGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
