import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { WorldEditService } from '../../services/WorldEditService/world-edit.service';

@Component({
  selector: 'app-integer-field',
  templateUrl: './integer-field.component.html',
  styleUrls: ['./integer-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IntegerFieldComponent),
      multi: true
    }
  ]
})
export class IntegerFieldComponent {
  @Input() public fieldName: string;
  public value: number;
  public active: boolean = false;
  public onChange: (value: string) => void;
  public onTouched: () => void;
  public disabled: boolean;
  @Input() public step: number = 1;

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

  public writeValue(value: number): void {
    this.value = value ? value : 0;
  }
}
