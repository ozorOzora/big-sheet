import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as Papa from 'papaparse';


@Injectable({
  providedIn: 'root'
})
export class CsvService {
  private _escapeChar = `\\`;
  private _chunkSize = 1024 * 1024 * 1; // 2MB
  private _newline = '\r';


  readFile(file: File) {
    return Observable.create(observer => {
      if (!(file instanceof File)) {
        observer.error(new Error('Must be an instance of File'));
        return;
      }
      Papa.parse(file, {
        delimiter: '\t',
        worker: false,
        header: true,
        chunkSize: this._chunkSize,
        step: (results: Papa.ParseResult, parser: Papa.Parser) => observer.next(results),
        complete: (results, file) => observer.complete()
      } as Papa.ParseConfig);
    });

  }

  readChunk(file, start: number, end: number = start + this._chunkSize): Observable<Papa.ParseResult> {
    return Observable.create(observer =>
      file.text().then(text => {
        Papa.parse(text.slice(start, end), {
          delimiter: '\t',
          worker: true,
          header: start == 0 ? true : false,
          complete: (result) => observer.next(result)
        })
      })
    );
  }

}
