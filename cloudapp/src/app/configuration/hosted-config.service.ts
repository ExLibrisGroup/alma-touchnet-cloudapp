import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CloudAppEventsService } from '@exlibris/exl-cloudapp-angular-lib';
import { of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HostedConfigService {

  private _headers: HttpHeaders;

  constructor(
    private http: HttpClient,
    private eventsService: CloudAppEventsService,
  ) {}
  
  getConfig() {
    return this.headers.pipe(
      switchMap(headers => this.http.get<any>(`${environment.touchnetService}/config`, { headers }))
    )
  }

  putConfig(config: any) {
    console.log('saving config', config);
    return this.headers.pipe(
      switchMap(headers => this.http.put<any>(`${environment.touchnetService}/config`, config, { headers }))
    )
  }

  deleteConfig() {
    return this.headers.pipe(
      switchMap(headers => this.http.delete(`${environment.touchnetService}/config`, { headers }))
    )
  }

  get headers() {
    return this._headers ? 
      of(this._headers) :
      this.eventsService.getAuthToken().pipe(
        tap(token => this._headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` })),
        map(() => this._headers)
      )
  }

}