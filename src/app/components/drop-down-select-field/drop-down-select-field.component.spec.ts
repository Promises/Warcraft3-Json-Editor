import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DropDownSelectFieldComponent } from './drop-down-select-field.component';

describe('DropDownSelectFieldComponent', () => {
  let component: DropDownSelectFieldComponent;
  let fixture: ComponentFixture<DropDownSelectFieldComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DropDownSelectFieldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DropDownSelectFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
