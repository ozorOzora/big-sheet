import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as Papa from 'papaparse';


@Injectable({
  providedIn: 'root'
})
export class CsvService {
  private _reader = new FileReader();
  private _escapeChar = `\\`;
  private _chunkSize = 1024 * 1024 * 1; // 2MB
  private _newline = '\r';
  private _config: Papa.ParseConfig = {
    delimiter: ';',
    quoteChar: '"',
  };

  readFile(file: File) {
    return Observable.create(observer => {
      if (!(file instanceof File)) {
        observer.error(new Error('Must be an instance of File'));
        return;
      }
      Papa.parse(file, Object.assign(this._config, {
        worker: true,
        header: true,
        chunkSize: this._chunkSize,
        step: (results: Papa.ParseResult, parser: Papa.Parser) => observer.next(results),
        complete: (results, file) => observer.complete()
      }));
    });

  }

  readChunk(file, start: number, end: number = start + this._chunkSize): Observable<Papa.ParseResult> {
    return Observable.create(observer => {
      const slice = file.slice(start, end > file.size ? file.size : end);
      Papa.parse(slice, {
        worker: true,
        header: start == 0 ? true : false,
        complete: (result) => observer.next(result)
      })
    });
  }

}
