import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TargetListFieldComponent } from './target-list-field.component';

describe('TargetListFieldComponent', () => {
  let component: TargetListFieldComponent;
  let fixture: ComponentFixture<TargetListFieldComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TargetListFieldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TargetListFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
