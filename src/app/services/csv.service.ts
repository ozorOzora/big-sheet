import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as Papa from 'papaparse';

@Injectable({
  providedIn: 'root'
})
export class CsvService {

  getLineIndices(file: File): Promise<Array<number>> {
    const reader = new Response(file).body.getReader();
    const endOfLineRegex = /\r\n|\n|\r/g;
    const utf8decoder = new TextDecoder();
    return new Promise(function (resolve, reject) {
      let lineIndices: Array<number> = [0];
      let lastIndex = 0;
      let lastIndexInChunk = 0;
      // reads 64 kbytes at a time
      const processChunk = ({ done, value }) => {
        if (done) {
          resolve(lineIndices);
        } else {
          var text = utf8decoder.decode(value);
          var match = endOfLineRegex.exec(text);
          while (match != null) {
            lastIndexInChunk = lastIndex + match.index;
            lineIndices.push(lastIndexInChunk);
            match = endOfLineRegex.exec(text);
          }
          lastIndex = lastIndexInChunk;
          return reader.read().then(processChunk.bind(this));
        }
      };
      reader.read().then(processChunk);
    })
  }

  readChunk(file, start: number, end: number): Observable<Papa.ParseResult> {
    const endOfLineRegex = /\r\n|\n|\r/g;
    const reader = new FileReader();
    return Observable.create(observer => {
      reader.onloadend = (() => {
        const text = (reader.result as string).split(endOfLineRegex);
        observer.next(text);
      });
      reader.readAsText(file.slice(start, end));
    });
  }

}
