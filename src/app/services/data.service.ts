import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Meeting } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(
    private httpClient: HttpClient
  ) { }

  getData(): Observable<Meeting[]> {
    return this.httpClient.get<Meeting[]>('/assets/data/input.json')
  }
}
