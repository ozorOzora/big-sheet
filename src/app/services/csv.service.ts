import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CsvService {

  getLineIndices(file: File): Promise<Array<number>> {
    const reader = new Response(file).body.getReader();
    const endOfLineRegex = /\r\n|\n|\r/g;
    const utf8decoder = new TextDecoder();
    return new Promise(function (resolve) {
      let lineIndices: Array<number> = [0];
      let totalBytesRead = 0;
      // on the author's computer, reads 64 kbytes at a time
      const processChunk = ({ done, value }) => {
        if (done) {
          lineIndices.push(file.size); // end of file
          resolve(lineIndices);
          return;
        }
        var text = utf8decoder.decode(value);
        var match = endOfLineRegex.exec(text);
        while (match != null) {
          lineIndices.push(totalBytesRead + match.index);
          match = endOfLineRegex.exec(text);
        }
        totalBytesRead += value.length;
        return reader.read().then(processChunk.bind(this));
      };
      reader.read().then(processChunk);
    })
  }

  readChunk(file, start: number, end: number): Observable<Array<string>> {
    const endOfLineRegex = /\r\n|\n|\r/g;
    const utf8decoder = new TextDecoder();
    const reader = new FileReader();
    return Observable.create(observer => {
      reader.onloadend = (() => {
        const text = utf8decoder.decode(new Uint8Array(reader.result as ArrayBuffer)).split(endOfLineRegex);
        observer.next(text);
      });
      reader.readAsArrayBuffer(file.slice(start, end > file.size ? file.size : end));
    });
  }

}
