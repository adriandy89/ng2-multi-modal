import { TestBed } from '@angular/core/testing';

import { Ng2MultiModalService } from './ng2-multi-modal.service';

describe('Ng2MultiModalService', () => {
  let service: Ng2MultiModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ng2MultiModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
