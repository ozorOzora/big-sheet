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

  private _lineIndicies = [];

  constructor(private _csvService: CsvService) {
    super();
  }

  fileUploaded(files: FileList) {

    console.time("this");
    this._file = files[0];
    this._csvService.getLineIndices(files[0]).then(lineIndicies => {
      console.timeEnd("this");
      this._lineIndicies = lineIndicies;
      this._dataStream.next(Array(this._lineIndicies.length).fill(null));
    })

  }

  connect(collectionViewer: CollectionViewer): Observable<Array<any>> {
    let firstRow;
    this._subscription = collectionViewer.viewChange.pipe(
      debounceTime(100),
      tap((range: { start: number; end: number; }) => { console.log("connect"); firstRow = range.start; }),
      flatMap((range: { start: number; end: number; }) => this._csvService.readChunk(this._file, this._lineIndicies[range.start], this._lineIndicies[range.end+1]))
    ).subscribe((result: ParseResult) => {
      let data = Array(this._length).fill(null);
      const newData = result.data.map((d) => {
        const keys = Object.keys(d);
        let datum = {};
        //for (var i = 0; i < keys.length; ++i)
        //  datum[this._headers[i]] = d[keys[i]];
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
