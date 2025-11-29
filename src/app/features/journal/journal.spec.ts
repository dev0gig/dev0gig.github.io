import { TestBed } from '@angular/core/testing';

import { Journal } from './journal';

describe('Journal', () => {
  let service: Journal;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Journal);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
