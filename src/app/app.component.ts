import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { flatMap, tap, debounceTime } from 'rxjs/operators';
import { CsvService } from './services/csv.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AppComponent extends DataSource<Array<string>>{

  private _file: File;
  private _dataStream = new BehaviorSubject<Array<string>>([]);
  private _subscription = new Subscription();
  private _lineIndicies = [];
  private _dataLength: number;

  constructor(private _csvService: CsvService) {
    super();
  }

  fileUploaded(files: FileList) {
    this._file = files[0];
    this._csvService.getLineIndices(files[0]).then(lineIndicies => {
      this._lineIndicies = lineIndicies;
      this._dataLength = this._lineIndicies.length;
      this._dataStream.next(Array(this._lineIndicies.length).fill(null));
    });
  }

  connect(collectionViewer: CollectionViewer): Observable<Array<any>> {
    let firstRow;
    this._subscription = collectionViewer.viewChange.pipe(
      debounceTime(100),
      tap((range: { start: number; end: number; }) => { range.end = Math.min(range.end, this._dataLength) }),
      flatMap((range: { start: number; end: number; }) => {
        return this._csvService.readChunk(this._file, this._lineIndicies[range.start], this._lineIndicies[range.end - 1]);
      })
    ).subscribe((result: Array<string>) => {
      let data = Array(this._lineIndicies.length).fill(null);
      data.splice(firstRow, result.length, ...result);
      this._dataStream.next(data);
    });
    return this._dataStream;
  }

  disconnect(): void {
    this._subscription.unsubscribe();
  }
}
