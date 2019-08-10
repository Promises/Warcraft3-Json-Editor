import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UnitEditorComponent } from './components/unit-editor/unit-editor.component';


const routes: Routes = [
  { path: 'unit', component: UnitEditorComponent },
  { path: '',
    redirectTo: '/unit',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
