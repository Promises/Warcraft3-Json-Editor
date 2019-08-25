import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgxElectronModule } from 'ngx-electron';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { UnitEditorComponent } from './components/unit-editor/unit-editor.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SafePipe } from './safe.pipe';
import { StringFieldComponent } from './components/string-field/string-field.component';
import { IntegerFieldComponent } from './components/integer-field/integer-field.component';
import { TargetListFieldComponent } from './components/target-list-field/target-list-field.component';
import { DropDownSelectFieldComponent } from './components/drop-down-select-field/drop-down-select-field.component';

registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    UnitEditorComponent,
    SafePipe,
    StringFieldComponent,
    IntegerFieldComponent,
    TargetListFieldComponent,
    DropDownSelectFieldComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxElectronModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    NgbModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
