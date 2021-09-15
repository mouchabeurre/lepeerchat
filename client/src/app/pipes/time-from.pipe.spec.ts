import { TimeFromPipe } from './time-from.pipe';

describe('TimeFromPipe', () => {
  it('create an instance', () => {
    const pipe = new TimeFromPipe();
    expect(pipe).toBeTruthy();
  });
});
