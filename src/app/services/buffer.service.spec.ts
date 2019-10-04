import { TestBed } from '@angular/core/testing';

import { BufferService } from './buffer.service';

describe('BufferService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BufferService = TestBed.get(BufferService);
    expect(service).toBeTruthy();
  });
});
