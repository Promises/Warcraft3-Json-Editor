import { Injectable } from '@angular/core';
import { createInterface, ReadLine } from 'readline';
import { createReadStream, existsSync, readFile, readFileSync } from 'fs';
import * as path from 'path';
import { UnitField, WCUnit } from '../../data/Unit';
import { UnitFieldsMap } from '../../data/Fields';

@Injectable({
  providedIn: 'root'
})
export class WorldEditService {
  private WEStrings: Map<string, string> = new Map<string, string>();
  private FieldData: Map<string, UnitField> = new Map<string, UnitField>();
  private SlkFieldBindings: Map<string, string> = new Map<string, string>();
  private SlkFileNames: string[] = [
    'CampaignUnitFunc.txt',
    'UnitAbilities.slk',
    'UnitBalance.slk',
    'UnitData.slk',
    'UnitUI.slk',
    'UnitWeapons.slk'
  ];
  public FIELD_ID_INDEXED: string = 'INDX';

  constructor() {

  }


  public LoadWorldEditString(): Promise<Map<string, string>> {
    return new Promise<Map<string, string>>((resolve, reject) => {
      const rl: ReadLine = createInterface({
        input: createReadStream(path.join(__dirname, '..', 'WorldEditStrings.txt'))
      });


      // event is emitted after each line
      rl.on('line', (line: string) => {
        if (line.includes('=')) {
          const linearr: string[] = line.split('=');
          this.WEStrings.set(linearr[0], linearr[1]);
        }
      });

      // end
      rl.on('close', (line) => {
        resolve(this.WEStrings);
      });
    });

  }

  public LoadUnitFieldConstants(): Promise<Map<string, UnitField>> {
    return new Promise<Map<string, UnitField>>((resolve, reject) => {
      readFile(path.join(__dirname, '..', 'UnitMetaData.json'), (err, data: any) => {
        const fieldData: any = JSON.parse(data);
        // console.log('loaded field data');
        for (const key in fieldData) {
          if (fieldData.hasOwnProperty(key)) {
            if (UnitFieldsMap.has(key)) {
              if (fieldData[key].type !== UnitFieldsMap.get(key).type) {
                console.log(key);
              }
            }
            this.FieldData.set(key, fieldData[key]);
          }
        }
        const indexed: string[] = [];
        this.FieldData.forEach((value, key) => {
          if (value.index === '-1' || value.index === '0') {
            this.SlkFieldBindings.set(value.field, key);
          } else {
            this.SlkFieldBindings.set(value.field + value.index, key);
            indexed.push(value.field);
          }
        });
        indexed.forEach((value => {
          if (this.SlkFieldBindings.has(value)) {
            const d: UnitField = this.FieldData.get(this.SlkFieldBindings.get(value));
            this.SlkFieldBindings.set(d.field, this.FIELD_ID_INDEXED);
            this.SlkFieldBindings.set(d.field + d.index, d.ID);
          } else {
            console.error(value);
          }
        }));
        resolve(this.FieldData);
      });
    });
  }

  /**
   * Get a World Edit string
   * @param key of string
   */
  public GetWorldEditString(key: string): string {
    return this.WEStrings.get(key);
  }

  /**
   * Check if a World Edit string exists
   * @param key of string
   */
  public HasWorldEditString(key: string): boolean {
    return this.WEStrings.has(key);
  }

  public SlkFieldToUnitField(key: string): string {
    return this.SlkFieldBindings.get(key);
  }

  public SlkFilesExists(baseDir: string): boolean {
    for (const fileName of this.SlkFileNames) {
      if (!existsSync(path.join(baseDir, fileName))) {
        console.error(`Missing slkfile: ${fileName}`);
        return false;
      }
    }
    return true;
  }

  public SlkParse(baseDir: string): Promise<Map<string, WCUnit>> {
    return new Promise<Map<string, WCUnit>>((resolve, reject) => {
      const UnitMap: Map<string, WCUnit> = new Map<string, WCUnit>();
      const promisestack: Promise<any>[] = [];
      for (const fileName of this.SlkFileNames) {
        if (fileName.endsWith('.txt')) {
          promisestack.push(this.ParseSlkTextFile(path.join(baseDir, fileName), UnitMap));
        } else {
          promisestack.push(this.ParseSlkFile(path.join(baseDir, fileName), UnitMap));
        }
      }
      Promise.all(promisestack).then(value => {
        resolve(UnitMap);
      });

    });


  }

  private ParseSlkFile(filePath: string, UnitMap: Map<string, WCUnit>): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const rl: ReadLine = createInterface({
        input: createReadStream(filePath)
      });

      let body: boolean = false;
      let matched: boolean = false;
      const indxToField: Map<number, string> = new Map<number, string>();
      let currentUnit: WCUnit;


      // event is emitted after each line
      rl.on('line', (line: string) => {

        if (!body) {
          if (line[0] === 'C') {
            const mtch: string[] = line.match(/C;X([0-9]+)(.*);K"(.*)"/);
            if (mtch[1] === '1') {
              if (mtch[2] !== ';Y1') {
                body = true;
              }
            } else {
              indxToField.set(Number(mtch[1]), mtch[3]);
            }

          }

        }
        if (body) {
          if (line[0] === 'C') {
            const mtch: string[] = line.match(/C;X([0-9]+)(.*);K(.*)/);
            if (mtch[1] === '1') {
              // if (mtch[2] !== ';Y1') {
              //   body = true;
              const unitId: string = mtch[3].match(/([a-zA-Z0-9]{4})/)[1];
              if (UnitMap.has(unitId)) {
                currentUnit = UnitMap.get(unitId);
              } else {
                currentUnit = new WCUnit({isCustom: true, baseUnit: 'nntg'});
                UnitMap.set(unitId, currentUnit);
              }
              // console.log(unitId);
            } else {
              let data: string = mtch[3];
              if (data.startsWith('"')) {
                data = data.substr(1, data.length - 2);
                if (data === '_' || data === '-') {
                  data = '';
                }
              }
              const fieldname: string = this.SlkFieldBindings.get(indxToField.get(Number(mtch[1])));
              // try {
              //   this.FieldData.get(fieldname).type;
              // } catch (e) {
              //   console.log(this.SlkFieldBindings.get(indxToField.get(Number(mtch[1]))));
              // }
              if (fieldname) {
                currentUnit[fieldname] = this.CleanType(fieldname, data);

              } else {
                // console.log(line);
              }
              // indxToField.set(Number(mtch[1]), mtch[3]);
            }

          }
        }

        // if (line.includes('=')) {
        //   const linearr: string[] = line.split('=');
        //   this.WEStrings.set(linearr[0], linearr[1]);
        // }
      });

      // end
      rl.on('close', (line) => {
        resolve(true);
      });
    });
  }

  private ParseSlkTextFile(filePath: string, UnitMap: Map<string, WCUnit>): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let currentUnit: WCUnit;
      const rl: ReadLine = createInterface({
        input: createReadStream(filePath)
      });


      // event is emitted after each line
      rl.on('line', (line: string) => {
        if (line !== '') {
          if (line.match(/ ?\[([a-zA-Z0-9]{4})\] ?$/)) {
            const unitId: string = line.match(/ ?\[([a-zA-Z0-9]{4})\] ?$/)[1];

            if (UnitMap.has(unitId)) {
              currentUnit = UnitMap.get(unitId);
            } else {
              currentUnit = new WCUnit({isCustom: true, baseUnit: 'nntg'});
              UnitMap.set(unitId, currentUnit);
            }
          } else {
            const linedata: string[] = line.split('=');
            const field: string = this.SlkFieldToUnitField(linedata[0]);
            if (field) {
              if (field === this.FIELD_ID_INDEXED) {
                const fldData: string[] = linedata[1].split(',');
                for (let i: number = 0; i < fldData.length; i++) {
                  const fieldName: string = this.SlkFieldToUnitField(linedata[0] + i);
                  currentUnit[fieldName] = this.CleanType(fieldName, fldData[i]);
                }
              } else {
                const fieldName: string = this.SlkFieldToUnitField(linedata[0]);
                currentUnit[fieldName] = this.CleanType(fieldName, linedata[1]);
              }

            } else {
              console.log(linedata);
            }

          }
          // if (line.includes('=')) {
          //   const linearr: string[] = line.split('=');
          //   this.WEStrings.set(linearr[0], linearr[1]);
          // }
        }

      });

      // end
      rl.on('close', (line) => {
        resolve(true);
        console.log(UnitMap);
      });
    });
  }

  public GetUnitFieldData(fieldName: string): UnitField {
    return this.FieldData.get(fieldName);
  }

  private CleanType(fieldName: string, data: string): any {

    switch (this.FieldData.get(fieldName).type) {
      case 'string':
        return data;
      case 'int':
        return Number(data);
      case 'unreal':
        return Number(data);
      case 'real':
        return Number(data);
      default:
        console.log('CleanType', `Couldn't find: ${this.FieldData.get(fieldName).type}`);
        return data;
    }
  }
}

