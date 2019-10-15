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

        if (!currentChunk.end) {
          currentChunk.end = result.meta.cursor;
          currentChunk.lastRow = currentChunk.firstRow;
        }
        else if (currentChunk.end != result.meta.cursor) {
          console.log(currentChunk);
          currentChunk = {
            start: currentChunk.end + 1,
            firstRow: currentChunk.lastRow + 1,
            end: result.meta.cursor,
            lastRow: currentChunk.lastRow + 1
          };
        }
        currentChunk.lastRow++;
        this._rows.push(currentChunk); // Ici une nouvelle copie de chunk est enregistrée pour chaque indice, peut-être utiliser une référence par chunk pour meilleures perf?

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
        if (!firstRow && !lastRow) {
          firstRow = this._rows[range.start].firstRow;
          lastRow = this._rows[range.end].lastRow;
        }
      }),
      filter(range => {
        console.log(range.start <= firstRow || range.end >= lastRow);
        return range.start <= firstRow || range.end >= lastRow; //Bon en gros j'en suis la
      }),
      flatMap((range: { start: number; end: number; }) => {
        //console.log("hello", range, this._rows);
        chunkStart = this._rows[range.start].start;
        firstRow = this._rows[range.start].firstRow;
        chunkEnd = this._rows[range.end].end;
        lastRow = this._rows[range.end].lastRow;
        console.log("range:", range, "\nfirstRow:", firstRow, "lastRow:", lastRow, "\nchunkStart:", chunkStart, "\nchunkEnd:", chunkEnd);
        return this._csvService.readChunk(this._file, chunkStart, chunkEnd);
      })
    ).subscribe((result: ParseResult) => {
      console.log(result);
      //console.log(this._length, lastRow);
      //TODO Ceci est un brouillon, revoir pour performances. Peut etre ajouter un index de rang pour debut et fin de chunk
      //let firstRowIndex = this._rows.findIndex(r => r.start == chunkStart);
      //let lastRowIndex = this._rows.findIndex(r => r.end > chunkEnd);
      let data = Array(this._length).fill(null);
      data.splice(firstRow, result.data.length, ...result.data);
      console.log(data);
      this._dataStream.next( data );
    });

    return this._dataStream;
  }

  disconnect(): void {
    this._subscription.unsubscribe();
  }
}
