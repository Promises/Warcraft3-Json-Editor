import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { WorldEditService } from '../../services/WorldEditService/world-edit.service';
import { ElectronMenuService } from '../../services/ElectronMenuService/electron-menu.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ElectronService } from 'ngx-electron';
import { lookupService } from 'dns';
import { readFile, existsSync, readFileSync, writeFile, writeFileSync } from 'fs';
import { WCUnit } from '../../data/Unit';
import { log } from 'util';
import { KeyValue } from '@angular/common';
import * as path from 'path';


@Component({
  selector: 'app-unit-editor',
  templateUrl: './unit-editor.component.html',
  styleUrls: ['./unit-editor.component.scss']
})
export class UnitEditorComponent implements OnInit {
  private loading: boolean = true;
  private UnitData: any;
  private UnitMap: Map<string, WCUnit>;
  private BaseUnits: Map<string, WCUnit>;

  private hasData: boolean = false;
  private FilteredUnitMap: Map<string, WCUnit>;
  private filterForm: FormGroup;
  private currentLoadedFile: string;
  private hasLoadedJson: boolean = false;

  constructor(private worldEditService: WorldEditService,
              private electronMenu: ElectronMenuService,
              private electronService: ElectronService,
              private changeDetector: ChangeDetectorRef,
              private fb: FormBuilder) {
  }

  public ngOnInit(): void {
    this.electronMenu.GetOpenFileSubject().subscribe((data) => this.OpenJsonDialog(data));
    this.electronMenu.GetOpenSlkFolderSubject().subscribe((data) => this.OpenSlkFolderDialog(data));
    this.electronMenu.GetSaveFileSubject().subscribe((data) => this.SaveFile(data));
    this.electronMenu.GetExportFileSubject().subscribe((data) => this.ExportFileDialog(data, false));
    this.worldEditService.LoadWorldEditString().then(() => {
      this.OnLoaded();
    });

    this.filterForm = this.fb.group({
      filterValue: [null]
    });
    this.filterForm.controls.filterValue.valueChanges.subscribe((value => {
      console.log(value);
      this.FilterUnits(value);
    }));
  }


  private OnLoaded(): void {
    console.log('loaded');
    this.loading = false;

  }

  private ImportSlkUnits(filenames: Electron.OpenDialogReturnValue): Promise<boolean> {
    if (filenames.filePaths) {
      return new Promise<boolean>((resolve, reject) => {
          if (this.worldEditService.SlkFilesExists(filenames.filePaths[0])) {
            this.currentLoadedFile = filenames.filePaths[0] + '/Units.json';

            console.log('found all files');
            this.worldEditService.SlkParse(filenames.filePaths[0]).then((data => {
              this.hasData = true;
              this.UnitMap = data;
              this.FilterUnits('');
              this.changeDetector.detectChanges();
            }));
          } else {
            reject(false);
          }
          // readFile(filenames.filePaths[0], (err, data: any) => {
          //   this.UnitData = JSON.parse(data);
          //   const UnitMap: Map<string, WCUnit> = new Map<string, WCUnit>();
          //
          //   for (const unit in this.UnitData.custom) {
          //     if (this.UnitData.custom[unit]) {
          //       const relation: string[] = unit.split(':');
          //       const u: WCUnit = new WCUnit({isCustom: true, baseUnit: relation[1]});
          //       for (const attr of this.UnitData.custom[unit]) {
          //         u[attr.id] = attr.value;
          //       }
          //       // console.log(u);
          //       UnitMap.set(relation[0], u);
          //
          //     }
          //   }
          //   this.UnitMap = UnitMap;
          //   return resolve(true);
          // });
        }
      );
    } else {
      return new Promise<boolean>(((resolve, reject) => {
        reject(false);
      }));
    }
  }

  private LoadJsonObject(filenames: Electron.OpenDialogReturnValue): Promise<boolean> {
    if (filenames.filePaths) {
      return new Promise<boolean>((resolve, reject) => {
        readFile(filenames.filePaths[0], (err, data: any) => {
          this.currentLoadedFile = filenames.filePaths[0];
          this.UnitData = JSON.parse(data);
          const UnitMap: Map<string, WCUnit> = new Map<string, WCUnit>();

          for (const unit in this.UnitData.custom) {
            if (this.UnitData.custom.hasOwnProperty(unit)) {
              const relation: string[] = unit.split(':');
              const u: WCUnit = new WCUnit({isCustom: true, baseUnit: relation[1]});
              for (const attr of this.UnitData.custom[unit]) {
                u[attr.id] = attr.value;
              }
              UnitMap.set(relation[0], u);
            }
          }
          this.UnitMap = UnitMap;
          this.hasLoadedJson = true;
          return resolve(true);
        });
      });
    } else {
      return new Promise<boolean>(((resolve, reject) => {
        reject(false);
      }));
    }
  }

  public HasLoadedData(): boolean {
    // console.log(this.hasData);
    return this.hasData;
  }

  private SelectUnit(entry: KeyValue<string, WCUnit>): void {
    console.log(entry);
  }

  private FilterUnits(query: string): void {
    const filterMap: Map<string, WCUnit> = new Map<string, WCUnit>();
    this.UnitMap.forEach((value, key) => {
      if (key.includes(query)) {
        filterMap.set(key, value);
      }
    });
    this.FilteredUnitMap = filterMap;
  }

  private OpenJsonDialog(data: boolean): void {
    this.electronService.remote.dialog.showOpenDialog({
      properties: ['openFile'], filters: [
        {name: 'Warcraft 3 Object Json', extensions: ['json']},
      ]
    }).then((filenames) => {
      this.LoadJsonObject(filenames).then((d) => {
        this.hasData = true;
        this.FilterUnits('');

        this.changeDetector.detectChanges();
      });
    });
  }

  private OpenSlkFolderDialog(data: boolean): void { // NOTE: USE base unit 'nntg' for these
    this.electronService.remote.dialog.showOpenDialog({
      properties: ['openDirectory'], filters: [
        {name: 'Warcraft 3 Slk Directory', extensions: ['*']},
      ]
    }).then((filenames) => {
      this.ImportSlkUnits(filenames).then((d) => {
        this.hasLoadedJson = false;
      });
    });
  }

  private SaveFile(data: boolean): void {
    if (this.hasLoadedJson) {
      this.SaveJsonFile(this.currentLoadedFile, true);
    } else {
      this.ExportFileDialog(data, true);
    }
  }


  private ExportFileDialog(data: boolean, setDefault: boolean): void {
    this.electronService.remote.dialog.showSaveDialog({
      defaultPath: this.currentLoadedFile,
      filters: [
        {name: 'Wc3 Json', extensions: ['json']},
        // { name: 'Wc3 Object', extensions: ['w3u'] }, // TODO: Would be practical to save directly to w3u
      ]
    }).then((p) => {
      this.SaveJsonFile(p.filePath, setDefault);
    });
  }

  private SaveJsonFile(filePath: string, setDefault: boolean): void {
    const saveobj: {} = {original: {}, custom: {}};
    for (const [key, value] of this.UnitMap.entries()) {
      const obj: any[] = [];
      const baseUNit: WCUnit = this.worldEditService.GetBaseUnit(value.baseUnit);
      for (const field in value) {
        if (value.hasOwnProperty(field)) {
          if (field !== 'isCustom' && field !== 'baseUnit') {
            if (value[field] !== baseUNit[field]) {
              const attribute: {} = {
                id: field,
                type: this.worldEditService.GetUnitFieldData(field).type,
                value: value[field],
              };
              obj.push(attribute);
            }

          }
        }

      }
      saveobj['custom'][key + ':' + value.baseUnit] = obj;
    }
    if (filePath) {
      writeFileSync(filePath, JSON.stringify(saveobj));
      if (setDefault) {
        this.hasLoadedJson = true;
        this.currentLoadedFile = filePath;
      }

    }

  }
}
