import { TestBed } from '@angular/core/testing';

import { WorldEditService } from './world-edit.service';

describe('WorldEditService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WorldEditService = TestBed.get(WorldEditService);
    expect(service).toBeTruthy();
  });
});
