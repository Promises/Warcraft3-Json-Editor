import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { WorldEditService } from '../../services/WorldEditService/world-edit.service';

@Component({
  selector: 'app-string-field',
  templateUrl: './string-field.component.html',
  styleUrls: ['./string-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StringFieldComponent),
      multi: true
    }
  ]
})
export class StringFieldComponent {
  @Input() fieldName: string;
  value: string;
  active: boolean = false;
  onChange: (value: string) => void;
  onTouched: () => void;
  disabled: boolean;

  constructor(public weService: WorldEditService) {
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;

  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(value: string): void {
    this.value = value ? value : '';
  }


}
