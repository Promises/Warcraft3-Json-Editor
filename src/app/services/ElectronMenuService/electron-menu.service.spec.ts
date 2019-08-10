import { TestBed } from '@angular/core/testing';

import { ElectronMenuService } from './electron-menu.service';

describe('ElectronMenuService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ElectronMenuService = TestBed.get(ElectronMenuService);
    expect(service).toBeTruthy();
  });
});
