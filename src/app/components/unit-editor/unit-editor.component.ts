import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { WorldEditService } from '../../services/WorldEditService/world-edit.service';
import { ElectronMenuService } from '../../services/ElectronMenuService/electron-menu.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ElectronService } from 'ngx-electron';
import { existsSync, readFile } from 'fs';
import { KeyValue } from '@angular/common';
import * as path from 'path';
import * as Translator from 'wc3maptranslator';
import * as storage from 'electron-json-storage';
import { WCUnit } from 'wc3-objectified-handler/dist/lib/data/Unit';


@Component({
  selector: 'app-unit-editor',
  templateUrl: './unit-editor.component.html',
  styleUrls: ['./unit-editor.component.scss']
})
export class UnitEditorComponent implements OnInit {
  private loading: boolean = true;
  private UnitData: any;
  private UnitMap: Map<string, WCUnit>;

  private hasData: boolean = false;
  private FilteredUnitMap: Map<string, WCUnit>;
  private filterForm: FormGroup;
  private currentLoadedFile: string;
  private hasLoadedJson: boolean = false;
  private currentForm: FormGroup = this.BlankForm();
  private selectedUnit: KeyValue<string, WCUnit>;

  constructor(public worldEditService: WorldEditService,
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

    this.filterForm = this.fb.group({
      filterValue: [null]
    });
    this.filterForm.controls.filterValue.valueChanges.subscribe((value => {
      this.FilterUnits(value);
    }));
    this.CheckAndLoadPastJson();
  }


  private OnLoaded(): void {
    this.loading = false;

  }


  private ImportSlkUnits(filenames: Electron.OpenDialogReturnValue): Promise<boolean> {
    if (filenames.filePaths) {
      return new Promise<boolean>((resolve, reject) => {
          if (this.worldEditService.SlkFilesExists(filenames.filePaths[0])) {
            this.currentLoadedFile = filenames.filePaths[0] + '/Units.json';

            this.worldEditService.SlkParse(filenames.filePaths[0]).then((data => {
              this.hasData = true;
              this.UnitMap = data;
              this.FilterUnits('');
              this.changeDetector.detectChanges();
            }));
          } else {
            reject(false);
          }
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
          const ud: any = JSON.parse(data);
          this.UnitMap = this.worldEditService.objectHandler.ParseJsonObject(ud);
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


  private LoadWc3UnitObject(filenames: Electron.OpenDialogReturnValue): Promise<boolean> {
    if (filenames.filePaths) {
      return new Promise<boolean>((resolve, reject) => {

        readFile(filenames.filePaths[0], (err, data: any) => {
          const result: any = new Translator.Objects.warToJson('units', data);
          this.UnitMap = this.worldEditService.objectHandler.ParseJsonObject(result.json);
          this.currentLoadedFile = path.dirname(filenames.filePaths[0]) + '/Units.json';
          this.hasLoadedJson = false;
          return resolve(true);
        });
      });
    } else {
      return new Promise<boolean>(((resolve, reject) => {
        reject(false);
      }));
    }
  }

  private SelectUnit(entry: KeyValue<string, WCUnit>): void {
    if (entry.value.utub) {
      entry.value.utub = entry.value.utub.split('|n').join('\n');
    }
    this.currentForm = this.worldEditService.CreateUnitForm(entry.value);
    this.selectedUnit = entry;

    this.changeDetector.detectChanges();
    this.currentForm.valueChanges.subscribe((changes) => {
      this.FormChanges(changes);
    });


  }

  private FilterUnits(query: string): void {
    const filterMap: Map<string, WCUnit> = new Map<string, WCUnit>();
    let isValid: boolean = true;
    try {
      // tslint:disable-next-line:no-unused-expression
      new RegExp(query);
    } catch (e) {
      isValid = false;
      query = '';
    }
    this.UnitMap.forEach((value, key) => {
      if (key.search(new RegExp(query)) >= 0) {
        filterMap.set(key, value);
        return;
      }
      if (value.GetName()) {
        if (value.GetName().search(new RegExp(query)) >= 0) {
          filterMap.set(key, value);
          return;
        }
      }
    });
    this.FilteredUnitMap = filterMap;
  }

  private OpenJsonDialog(data: boolean): void {
    this.electronService.remote.dialog.showOpenDialog({
      properties: ['openFile'], filters: [
        {name: 'Supported files', extensions: ['json', 'w3u']},
        {name: 'Warcraft 3 Object Json', extensions: ['json']},
        {name: 'Warcraft 3 Units Object ', extensions: ['w3u']},
      ]
    }).then((filenames) => {
      if (filenames.filePaths && filenames.filePaths[0]) {
        if (filenames.filePaths[0].endsWith('.w3u')) {
          this.LoadWc3UnitObject(filenames).then((d) => {
            this.FinishedLoadingJson(d);
          });
        } else if ((filenames.filePaths[0].endsWith('.json'))) {
          this.LoadJsonObject(filenames).then((d) => {
            this.FinishedLoadingJson(d);
          });
        }
      }
    });
  }

  private FinishedLoadingJson(data: any): void {
    this.hasData = true;
    this.FilterUnits('');
    this.changeDetector.detectChanges();
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
      this.hasLoadedJson = true;
      this.currentLoadedFile = this.worldEditService.objectHandler.SaveObjectifiedJsonFile(this.currentLoadedFile, this.UnitMap);
      storage.set('lastjson', {currentLoadedFile: this.currentLoadedFile}, (error) => {
          if (error) {
            throw error;
          }
        }
      );
    } else {
      this.ExportFileDialog(data, true);
    }
  }


  private ExportFileDialog(data: boolean, setDefault: boolean): void {
    this.electronService.remote.dialog.showSaveDialog({
      defaultPath: this.currentLoadedFile,
      filters: [
        {name: 'Wc3 Json', extensions: ['json']},
        // {name: 'Wc3 Object', extensions: ['w3u']}, // TODO: Would be practical to save directly to w3u
      ]
    }).then((p) => {
      // this.SaveObjectFile(p.filePath, setDefault);
      const savePath: string = this.worldEditService.objectHandler.SaveObjectifiedJsonFile(p.filePath, this.UnitMap);
      if (setDefault) {
        this.currentLoadedFile = savePath;
        this.hasLoadedJson = true;
        storage.set('lastjson', {currentLoadedFile: this.currentLoadedFile}, (error) => {
            if (error) {
              throw error;
            }
          }
        );
      }

    });
  }


  // private SaveObjectFile(filePath: string, setDefault: boolean): void {
  //   const saveobj: {} = {original: {}, custom: {}};
  //   for (const [key, value] of this.UnitMap.entries()) {
  //     const obj: any[] = [];
  //     const baseUNit: WCUnit = this.worldEditService.GetBaseUnit(value.baseUnit);
  //     for (const field in value) {
  //       if (value.hasOwnProperty(field)) {
  //         if (field !== 'isCustom' && field !== 'baseUnit') {
  //           if (value[field] !== baseUNit[field]) {
  //             const attribute: {} = {
  //               id: field,
  //               type: this.worldEditService.GetUnitFieldData(field).type,
  //               value: value[field],
  //             };
  //             obj.push(attribute);
  //           }
  //
  //         }
  //       }
  //
  //     }
  //     saveobj['custom'][key + ':' + value.baseUnit] = obj;
  //   }
  //   if (filePath) {
  //     const objResult = new Translator.Objects.jsonToWar('units', saveobj); // Custom units -> war3map.w3u
  //     writeFileSync(filePath, objResult.buffer);
  //     // Write(WarFile.Object.Unit, objResult.buffer);
  //     if (setDefault) {
  //       this.hasLoadedJson = true;
  //       this.currentLoadedFile = filePath;
  //     }
  //
  //   }
  //
  // }

  public FormattedText(text: string): string {
    const regex = new RegExp('\\|C([0-9A-F]{8})((?:(?!\\|C).)*)\\|R', 'i');
    let result = text.split('|n').join('<br>').split('\n').join('<br>');
    let exec = regex.exec(result);
    while (exec !== null) {
      const index = exec.index;
      const color = 'rgba(' + parseInt(exec[1].substr(2, 2), 16) + ', ' + parseInt(exec[1].substr(4, 2), 16) + ', ' + parseInt(exec[1].substr(6, 2), 16) + ', ' + (parseInt(exec[1].substr(0, 2), 16) / 255) + ')';
      result = result.substr(0, index) + `<span style="color: ${color}">` + result.substr(index + 2 + exec[1].length, exec[2].length) + '</span>' + result.substr(index + 4 + exec[1].length + exec[2].length);
      exec = regex.exec(result);
    }
    return result;
  }

  private FormChanges(changes: any): void {
    this.selectedUnit.value.setValues(changes);
    this.changeDetector.detectChanges();

  }


  public generateUnitTooltip(): void {
    const attacksEnabled: number = this.selectedUnit.value.uaen;
    let value: string = '';
    if (attacksEnabled === 1 || attacksEnabled === 3) {
      value += '|cffffcc00Attack:|r '
        + this.selectedUnit.value.ua1t.charAt(0).toUpperCase()
        + this.selectedUnit.value.ua1t.substr(1) + '|n';
      value += '|cffffcc00Cooldown:|r ' + this.selectedUnit.value.ua1c.toFixed(2) + '|n';
      const baseDamage: number = this.selectedUnit.value.ua1b;
      const damageNumberOfDice: number = this.selectedUnit.value.ua1d;
      const damageSidesPerDie: number = this.selectedUnit.value.ua1s;
      value += '|cffffcc00Damage:|r ' + (baseDamage + damageNumberOfDice)
        + ' - ' + (baseDamage + damageNumberOfDice * damageSidesPerDie) + '|n';
      value += '|cffffcc00Range:|r ' + (this.selectedUnit.value.ua1r === 128 ? 'Melee' : this.selectedUnit.value.ua1r) + '|n';
    } else if (attacksEnabled === 2) {
      value += '|cffffcc00Attack:|r ' + this.selectedUnit.value.ua2t.charAt(0).toUpperCase() +
        +this.selectedUnit.value.ua2t.substr(1) + '|n';
      value += '|cffffcc00Cooldown:|r ' + this.selectedUnit.value.ua2c.toFixed(2) + '|n';
      const baseDamage: number = this.selectedUnit.value.ua2b;
      const damageNumberOfDice: number = this.selectedUnit.value.ua2d;
      const damageSidesPerDie: number = this.selectedUnit.value.ua2s;
      value += '|cffffcc00Damage:|r ' + (baseDamage + damageNumberOfDice) + ' - '
        + (baseDamage + damageNumberOfDice * damageSidesPerDie) + '|n';
      value += '|cffffcc00Range:|r ' + (this.selectedUnit.value.ua2r === 128 ? 'Melee' : this.selectedUnit.value.ua2r) + '|n';
    } else if (attacksEnabled === 0) {
      value += '|cffffcc00Attack:|r None|n';
      value += '|cffffcc00Range:|r ' + (this.selectedUnit.value.ua1r === 128 ? 'Melee' : this.selectedUnit.value.ua1r) + '|n';
    }

    if (attacksEnabled === 3) {
      value += '|cffffcc00Attack(2):|r ' + this.selectedUnit.value.ua2t.charAt(0).toUpperCase() +
        +this.selectedUnit.value.ua2t.substr(1) + '|n';
      value += '|cffffcc00Cooldown(2):|r ' + this.selectedUnit.value.ua2c.toFixed(2) + '|n';
      const baseDamage: number = this.selectedUnit.value.ua2b;
      const damageNumberOfDice: number = this.selectedUnit.value.ua2d;
      const damageSidesPerDie: number = this.selectedUnit.value.ua2s;
      value += '|cffffcc00Damage(2):|r ' + (baseDamage + damageNumberOfDice) + ' - '
        + (baseDamage + damageNumberOfDice * damageSidesPerDie) + '|n';
      value += '|cffffcc00Range(2):|r ' + (this.selectedUnit.value.ua2r === 128 ? 'Melee' : this.selectedUnit.value.ua2r) + '|n';
    }

    value = value.split('|n').join('\n');

    this.currentForm.controls.utub.patchValue(value);
  }


  private CheckAndLoadPastJson(): void {
    storage.get('lastjson', (error, data) => {
        if (error) {
          throw error;
        }

        if (data.currentLoadedFile) {
          if (existsSync(data.currentLoadedFile)) {
            this.LoadJsonObject({filePaths: [data.currentLoadedFile]} as Electron.OpenDialogReturnValue).then((d) => {
              this.FinishedLoadingJson(d);
            });
          }
        }
      }
    );
  }

  private BlankForm(): FormGroup {
    const form: FormGroup = this.worldEditService.BlankUnitForm();
    // for (const ctrl in form.controls) {
    //   if (form.get(ctrl)) {
    //     form.get(ctrl).disable();
    //   }
    // }
    return form;
  }
}
