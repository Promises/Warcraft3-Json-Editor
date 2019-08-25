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
  @Input() public fieldName: string;
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
