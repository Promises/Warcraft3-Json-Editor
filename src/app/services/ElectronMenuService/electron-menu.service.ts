import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { WorldEditService } from '../WorldEditService/world-edit.service';
import { Subject } from 'rxjs';
import App = Electron.App;

@Injectable({
  providedIn: 'root'
})
export class ElectronMenuService {
  private clickedOpenFile: Subject<boolean> = new Subject<boolean>();
  private clickedImportStrings: Subject<boolean> = new Subject<boolean>();
  private clickedOpenFolder: Subject<boolean> = new Subject<boolean>();
  private clickedExportFile: Subject<boolean> = new Subject<boolean>();
  private clickedSaveFile: Subject<boolean> = new Subject<boolean>();

  constructor(private electronService: ElectronService) {
    const Menu: any = this.electronService.remote.Menu;
    const app: App = this.electronService.remote.app;
    const isMac: boolean = this.electronService.isMacOS;
    const template: any = [
      // { role: 'appMenu' }
      ...(process.platform === 'darwin' ? [{
        label: app.getName(),
        submenu: [
          {role: 'about'},
          {type: 'separator'},
          {role: 'services'},
          {type: 'separator'},
          {role: 'hide'},
          {role: 'hideothers'},
          {role: 'unhide'},
          {type: 'separator'},
          {role: 'quit'}
        ]
      }] : []),
      // { role: 'fileMenu' }
      {
        label: 'File',
        submenu: [
          {
            label: 'Open File', click: () => {
              this.clickedOpenFile.next(true);
            }
          },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              console.log('save');
              this.clickedSaveFile.next(true); // Same as export "for now"

            }
          },
          {
            label: 'Save As',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => {
              console.log('save as');
              this.clickedExportFile.next(true); // Same as export "for now"
            }
          },
          {
            label: 'Import Slk', click: () => {
              this.clickedOpenFolder.next(true);
            }
          },
          {
            label: 'Import Strings', click: () => {
              this.clickedImportStrings.next(true);
            }
          },
          {type: 'separator'},
          {
            label: 'Export File',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => {
              this.clickedExportFile.next(true);
            }
          },
          {type: 'separator'},

          isMac ? {role: 'close'} : {role: 'quit'}
        ]
      },
      // { role: 'editMenu' }
      {
        label: 'Edit',
        submenu: [
          {role: 'undo'},
          {role: 'redo'},
          {type: 'separator'},
          {role: 'cut'},
          {role: 'copy'},
          {role: 'paste'},
          ...(isMac ? [
            {role: 'pasteAndMatchStyle'},
            {role: 'delete'},
            {role: 'selectAll'},
            {type: 'separator'},
            {
              label: 'Speech',
              submenu: [
                {role: 'startspeaking'},
                {role: 'stopspeaking'}
              ]
            }
          ] : [
            {role: 'delete'},
            {type: 'separator'},
            {role: 'selectAll'}
          ])
        ]
      },
      // { role: 'viewMenu' }
      {
        label: 'View',
        submenu: [
          {role: 'reload'},
          {role: 'forcereload'},
          {role: 'toggledevtools'},
          {type: 'separator'},
          {role: 'resetzoom'},
          {role: 'zoomin'},
          {role: 'zoomout'},
          {type: 'separator'},
          {role: 'togglefullscreen'}
        ]
      },
      // { role: 'windowMenu' }
      {
        label: 'Window',
        submenu: [
          {role: 'minimize'},
          {role: 'zoom'},
          ...(isMac ? [
            {type: 'separator'},
            {role: 'front'},
            {type: 'separator'},
            {role: 'window'}
          ] : [
            {role: 'close'}
          ])
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: async () => {
              const {shell} = require('electron');
              await shell.openExternal('https://electronjs.org');
            }
          }
        ]
      }
    ];

    const menu: any = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  public GetOpenFileSubject(): Subject<boolean> {
    return this.clickedOpenFile;
  }

  public GetImportStringsSubject(): Subject<boolean> {
    return this.clickedImportStrings;
  }

  public GetOpenSlkFolderSubject(): Subject<boolean> {
    return this.clickedOpenFolder;
  }

  public GetExportFileSubject(): Subject<boolean> {
    return this.clickedExportFile;
  }
  public GetSaveFileSubject(): Subject<boolean> {
    return this.clickedSaveFile;
  }

}
