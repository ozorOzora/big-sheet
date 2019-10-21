import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { flatMap, filter, tap, debounceTime } from 'rxjs/operators';
import { CsvService } from './services/csv.service';
import { ParseResult } from 'papaparse';

interface Chunk {
  start: number,
  end: number,
  firstRow: number,
  lastRow: number
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AppComponent extends DataSource<Array<string>>{

  private _file: File;
  private _headers: Array<string>;
  private _rows: Array<Chunk>;
  private _length: number;
  private _dataStream = new BehaviorSubject<Array<string>>([]);
  private _subscription = new Subscription();

  private _dataArray = [];

  constructor(private _csvService: CsvService) {
    super();
  }

  fileUploaded(files: FileList) {

    this._file = files[0];
    this._rows = [];
    let currentChunk: Chunk = {
      start: 0,
      end: null,
      firstRow: 0,
      lastRow: null
    };

    this._csvService.readFile(this._file).subscribe(
      (result: ParseResult) => {
        this._headers = result.meta.fields;

        if (!currentChunk.end) {
          currentChunk.end = result.meta.cursor;
          currentChunk.lastRow = currentChunk.firstRow;
        }
        else if (currentChunk.end != result.meta.cursor) {
          currentChunk = {
            start: currentChunk.end + 1,
            firstRow: currentChunk.lastRow + 1,
            end: result.meta.cursor,
            lastRow: currentChunk.lastRow + 1
          };
        } else {
          currentChunk.lastRow++;
        }
        this._rows.push(currentChunk); // Ici on utilise une référence par chunk
      },
      err => { throw err },
      () => {
        this._length = this._rows.length;
        this._dataStream.next(Array(this._length).fill(null));
      }
    );

  }

  connect(collectionViewer: CollectionViewer): Observable<Array<any>> {

    let chunkStart, chunkEnd, firstRow, lastRow;

    this._subscription = collectionViewer.viewChange.pipe(
      debounceTime(100),
      tap(range => {
        console.log(range);
        if (!firstRow && !lastRow) {
          firstRow = this._rows[range.start].firstRow;
          lastRow = this._rows[range.end - 1].lastRow;
        }
      }),
      filter(range => range.start <= firstRow || range.end >= lastRow),
      flatMap((range: { start: number; end: number; }) => {
        chunkStart = this._rows[range.start].start;
        firstRow = this._rows[range.start].firstRow;
        chunkEnd = this._rows[range.end - 1].end;
        lastRow = this._rows[range.end - 1].lastRow;
        console.log("range:", range, "\nfirstRow:", firstRow, "lastRow:", lastRow, "\nchunkStart:", chunkStart, "\nchunkEnd:", chunkEnd);
        return this._csvService.readChunk(this._file, chunkStart, chunkEnd);
      })
    ).subscribe((result: ParseResult) => {
      let data = Array(this._length).fill(null);
      const newData = result.data.map((d) => {
        const keys = Object.keys(d);
        let datum = {};
        for (var i = 0; i < keys.length; ++i)
          datum[this._headers[i]] = d[keys[i]];
        return datum;
      });
      data.splice(firstRow, result.data.length, ...newData);
      this._dataStream.next(data);
    });

    return this._dataStream;
  }

  disconnect(): void {
    this._subscription.unsubscribe();
  }
}
