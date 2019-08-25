import { ChangeDetectorRef, Component, forwardRef, Input, OnInit } from '@angular/core';
import { WorldEditService } from '../../services/WorldEditService/world-edit.service';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-target-list-field',
  templateUrl: './target-list-field.component.html',
  styleUrls: ['./target-list-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TargetListFieldComponent),
      multi: true
    }
  ]
})
export class TargetListFieldComponent implements OnInit {
  @Input() public fieldName: string;
  public value: string;
  public active: boolean = false;
  public onChange: (value: string) => void;
  public onTouched: () => void;
  public disabled: boolean;
  private fields: string[] = [];

  constructor(public weService: WorldEditService, private changeDetector: ChangeDetectorRef) {
  }

  public ngOnInit(): void {
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
    this.fields = value.split(',');
    this.value = value ? value : '';
  }

  public SaveField($event: any): void {
    if ($event.target.checked) {
      this.fields.push($event.target.value);
    } else {
      if (this.isChecked($event.target.value)) {
        this.fields.splice(this.fields.indexOf($event.target.value), 1);
      }
    }
    console.log(this.fields);
    this.value = this.fields.join(',');
    this.onChange(this.value);
    this.changeDetector.detectChanges();
  }

  public isChecked(value: string): boolean {
    return this.fields.indexOf(value) >= 0;
  }
}
