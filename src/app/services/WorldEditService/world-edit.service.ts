import { Injectable } from '@angular/core';
import { createInterface, ReadLine } from 'readline';
import { createReadStream, existsSync, readFile, readFileSync } from 'fs';
import * as path from 'path';
import { FormBuilder, FormGroup } from '@angular/forms';
import { WC3ObjectHandler } from 'wc3-objectified-handler';
import { SelectValue } from 'wc3-objectified-handler/dist/lib/data/Fields';
import { WCUnit } from 'wc3-objectified-handler/dist/lib/data/Unit';

@Injectable({
  providedIn: 'root'
})
export class WorldEditService {
  private WEStrings: Map<string, string> = new Map<string, string>();
  private SlkFileNames: string[] = [
    'CampaignUnitFunc.txt',
    'UnitAbilities.slk',
    'UnitBalance.slk',
    'UnitData.slk',
    'UnitUI.slk',
    'UnitWeapons.slk'
  ];
  public FIELD_ID_INDEXED: string = 'INDX';
  public ArmourTypes: SelectValue[] = [
    {value: 'Ethereal', display: 'Ethereal'},
    {value: 'Flesh', display: 'Flesh'},
    {value: 'Metal', display: 'Metal'},
    {value: 'Stone', display: 'Stone'},
    {value: 'Wood', display: 'Wood'}
  ];
  public AttackTypes: SelectValue[] = [
    {value: 'unknown', display: 'None'},
    {value: 'normal', display: 'Normal'},
    {value: 'pierce', display: 'Pierce'},
    {value: 'siege', display: 'Siege'},
    {value: 'spells', display: 'Spells'},
    {value: 'chaos', display: 'Chaos'},
    {value: 'magic', display: 'Magic'},
    {value: 'hero', display: 'Hero'}
  ];
  public ready: boolean = false;
  public objectHandler: WC3ObjectHandler;

  constructor(private fb: FormBuilder, ) {
    this.objectHandler = new WC3ObjectHandler();
    this.objectHandler.LoadUnitFieldConstants();
    this.objectHandler.LoadDefaultUnits();
    this.LoadWorldEditString();
    this.ready = true;

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
                currentUnit = new WCUnit(unitId, {isCustom: true, baseUnit: 'nntg'});
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
              const fieldname: string = this.objectHandler.SlkFieldToUnitField(indxToField.get(Number(mtch[1])));
              // try {
              //   this.FieldData.get(fieldname).type;
              // } catch (e) {
              //   console.log(this.SlkFieldBindings.get(indxToField.get(Number(mtch[1]))));
              // }
              if (fieldname) {
                currentUnit[fieldname] = this.objectHandler.CleanType(fieldname, data);

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
              currentUnit = new WCUnit(unitId, {isCustom: true, baseUnit: 'nntg'});
              UnitMap.set(unitId, currentUnit);
            }
          } else {
            const linedata: string[] = line.split('=');
            const field: string = this.objectHandler.SlkFieldToUnitField(linedata[0]);
            if (field) {
              if (field === this.FIELD_ID_INDEXED) {
                const fldData: string[] = linedata[1].split(',');
                for (let i: number = 0; i < fldData.length; i++) {
                  const fieldName: string = this.objectHandler.SlkFieldToUnitField(linedata[0] + i);
                  currentUnit[fieldName] = this.objectHandler.CleanType(fieldName, fldData[i]);
                }
              } else {
                const fieldName: string = this.objectHandler.SlkFieldToUnitField(linedata[0]);
                let data: string = linedata[1];
                if (data.startsWith('"')) {
                  data = data.substr(1, data.length - 2);
                  if (data === '_' || data === '-') {
                    data = '';
                  }
                }
                currentUnit[fieldName] = this.objectHandler.CleanType(fieldName, data);
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


  public CreateUnitForm(selectedUnit: WCUnit): FormGroup {
    const formgroup: FormGroup = this.BlankUnitForm();

    formgroup.patchValue(this.objectHandler.GetBaseUnit(selectedUnit.baseUnit));
    formgroup.patchValue(selectedUnit);

    return formgroup;
  }

  public BlankUnitForm(): FormGroup {
    const formgroup: FormGroup = this.fb.group({
      utip: [''],
      uhot: [''],
      unam: [''],
      unsf: [''],
      utub: [''],
      uarm: [''],
      utyp: [''],
      uabi: [''],
      ua2g: [''],
      // ides: [''],
      ua1g: [''],
      ubsl: [''],
      ua1t: [''],
      ucun: [''],
      ushb: [''],
      uspa: [''],
      upap: [''],
      uani: [''],
      uico: [''],
      ua2w: [''],
      utra: [''],
      upgr: [''],
      uubs: [''],
      umki: [''],
      ua2t: [''],
      umdl: [''],
      usei: [''],
      ucut: [''],
      upat: [''],
      ua2m: [''],
      umvt: [''],
      ua1w: [''],
      udaa: [''],
      urac: [''],
      ua1m: [''],
      ua2p: [''],
      ures: [''],
      ubui: [''],
      udty: [''],
      ureq: [''],
      ushu: [''],
      ua1p: [''],
      ucs1: [''],
      uhrt: [''],
      util: [''],
      utar: [''],
      uupt: [''],
      uaap: [''],
      uabt: [''],
      usnd: [''],
      upoi: [0],
      ubld: [0],
      urpp: [0],
      ua1d: [0],
      urtm: [0],
      ubdg: [0],
      usst: [0],
      uhpm: [0],
      uclg: [0],
      usid: [0],
      ua1q: [0],
      ucam: [0],
      ua2b: [0],
      ufma: [0],
      uscb: [0],
      umpi: [0],
      ua2q: [0],
      umvs: [0],
      ubsi: [0],
      ua2d: [0],
      uori: [0],
      ua2s: [0],
      utc1: [0],
      uhos: [0],
      umpm: [0],
      umh1: [0],
      uhom: [0],
      udef: [0],
      uspe: [0],
      ua1b: [0],
      udea: [0],
      urpo: [0],
      uept: [0],
      ua2h: [0],
      ulur: [0],
      uaen: [0],
      ugor: [0],
      ufle: [0],
      urev: [0],
      ubpy: [0],
      ufor: [0],
      uine: [0],
      ubba: [0],
      ua1h: [0],
      utc2: [0],
      ua2f: [0],
      ubpx: [0],
      ulum: [0],
      usma: [0],
      ufoo: [0],
      ubdi: [0],
      ucbo: [0],
      ua1s: [0],
      utcc: [0],
      usin: [0],
      udro: [0],
      ua2z: [0],
      ua2r: [0],
      upri: [0],
      utco: [0],
      ua1f: [0],
      ua1z: [0],
      udup: [0],
      usle: [0],
      unbm: [0],
      usrg: [0],
      uclr: [0],
      ua1r: [0],
      ulev: [0],
      uclb: [0],
      umis: [0],
      umas: [0],
      ugol: [0],
      umh2: [0],
      umpr: [0],
      udp1: [0],
      ua2c: [0],
      uqd1: [0],
      uhd1: [0],
      umxp: [0],
      urb2: [0],
      uacq: [0],
      umxr: [0],
      urun: [0],
      ubs1: [0],
      usca: [0],
      uwal: [0],
      ubs2: [0],
      urb1: [0],
      umvf: [0],
      udp2: [0],
      uma2: [0],
      udl1: [0],
      usr1: [0],
      uma1: [0],
      umvh: [0],
      uhd2: [0],
      umvr: [0],
      uhpr: [0],
      uabr: [0],
      ussc: [0],
      ulpz: [0],
      uerd: [0],
      ucol: [0],
      usd1: [0],
      ua1c: [0],
      uqd2: [0],
      uamn: [0],
      ulfo: [0],
      ulfi: [0],
      udtm: [0],
      ubpr: [''],
    });
    return formgroup;
  }



  public FieldToName(field: string): string {
    return this.WEStrings.get(this.objectHandler.GetUnitFieldData(field).displayName);
  }
}

