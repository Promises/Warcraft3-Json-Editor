import { Component } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { readFile } from 'fs';
import { DataTypeMap, DataTypeString, UnitFieldsMap } from './data/Fields';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private title: string = 'Wc3JsonEditor';
  private keys: Map<string, boolean> = new Map<string, boolean>();

  constructor(private electronService: ElectronService) {
  }


  private loadFileButton(): void {
    this.electronService.remote.dialog.showOpenDialog({}, (filenames) => {
      if (filenames) {
        readFile(filenames[0], (err, data) => {
          if (err) {
            console.log(err);
            return;
          }
          const jdata = JSON.parse(data);
          if (jdata.custom) {
            for (let unit in jdata.custom) {
              for (let key in jdata.custom[unit]) {
                if (jdata.custom[unit][key].type) {
                  if (DataTypeMap.get(jdata.custom[unit][key].type) !== UnitFieldsMap.get(jdata.custom[unit][key].id).type) {
                    console.log(jdata.custom[unit][key]);

                  }
                }

              }
            }
          }
        });
      }
    });
  }
}
