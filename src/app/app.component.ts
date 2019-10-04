import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DataSource, CollectionViewer } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { BufferService } from './services/buffer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AppComponent {
  private _dataSource = new ScrollDataSource();

  constructor(
    private _bufferService: BufferService
  ) { }

  fileUploaded(files: FileList) {
    this._bufferService.readFile(files[0]).subscribe((buffer: ArrayBuffer) => {
      console.log("yes");
      this._dataSource.buffer = buffer;
    });
  }
}

export class ScrollDataSource extends DataSource<Array<string>>{
  private _buffer: ArrayBuffer;
  private _dataStream = new BehaviorSubject<Array<string>>(["hi0", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi13", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi", "hi28"]);
  private _pageSize = 1000;
  private _subscription = new Subscription();

  get buffer() { return this._buffer; }
  set buffer(value: ArrayBuffer) { this._buffer = value; }

  connect(collectionViewer: CollectionViewer): Observable<any> {
    this._subscription.add(collectionViewer.viewChange.subscribe(range => {
      console.log(range);
      const startPage = this._getPageForIndex(range.start);
      const endPage = this._getPageForIndex(range.end - 1);
      for (let i = startPage; i <= endPage; i++) {
        this._fetchPage(i);
      }
    }));
    return this._dataStream;
  }

  disconnect(): void {
    this._subscription.unsubscribe();
  }

  private _getPageForIndex(index: number): number {
    return Math.floor(index / this._pageSize);
  }

  private _fetchPage(page: number) {
    if (!this._buffer) return;
    const view = new DataView(this._buffer as ArrayBuffer, page * this._pageSize, this._pageSize);
    const pageView = new TextDecoder("utf-8").decode(view);
    const entries = pageView.split('\n');
    console.log(entries);
    this._dataStream.next(entries);
  }
}
