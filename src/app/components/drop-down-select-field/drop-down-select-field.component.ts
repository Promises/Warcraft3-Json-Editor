import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { WorldEditService } from '../../services/WorldEditService/world-edit.service';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-drop-down-select-field',
  templateUrl: './drop-down-select-field.component.html',
  styleUrls: ['./drop-down-select-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropDownSelectFieldComponent),
      multi: true
    }
  ]
})
export class DropDownSelectFieldComponent {
  @Input() public fieldName: string;
  @Input() public options: string[];
  public value: string;
  public active: boolean = false;
  public onChange: (value: string) => void;
  public onTouched: () => void;
  public disabled: boolean;

  constructor(public weService: WorldEditService) {
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;

  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public writeValue(value: string): void {
    this.value = value ? value : '';
  }


}
