import { Component } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { createReadStream, readFile } from 'fs';
import * as path from 'path';
import { createInterface, ReadLine } from 'readline';
import { WorldEditService } from './services/WorldEditService/world-edit.service';
import MenuItemConstructorOptions = Electron.MenuItemConstructorOptions;
import App = Electron.App;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private title: string = 'Wc3JsonEditor';
  private keys: Map<string, boolean> = new Map<string, boolean>();
  private loading: boolean = false;


  constructor(private electronService: ElectronService, private worldEditService: WorldEditService) {

  }


  private loadFileButton(): void {
    // readFile(path.join(__dirname, '..', 'WorldEditStrings.txt'), (err, data) => {
    //   console.log(data);
    // });
    this.loading = true;
    this.worldEditService.LoadWorldEditString().then(() => {
      this.loading = false;
    });
  }


  private HasString(): boolean {
    return this.worldEditService.HasWorldEditString('WESTRING_QUESTMESSAGE_COMPLETED');
  }

  private GetString(): string {
    return this.worldEditService.GetWorldEditString('WESTRING_QUESTMESSAGE_COMPLETED');
  }
}
