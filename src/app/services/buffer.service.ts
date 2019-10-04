import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BufferService {

  constructor() { }

  readFile(file: File) {
    console.log(file);
    return Observable.create(observer => {
      if (!(file instanceof File)) {
        observer.error(new Error('Must be an instance of File'));
        return;
      }

      const reader = new FileReader();

      reader.onerror = err => observer.error(err);
      reader.onabort = err => observer.error(err);
      reader.onload = () => observer.next(reader.result);
      reader.onloadend = () => observer.complete();

      return reader.readAsArrayBuffer(file);
    });
  }
}
