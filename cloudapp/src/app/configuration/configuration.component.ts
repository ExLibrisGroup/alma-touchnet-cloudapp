import { Component, OnInit, Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Configuration } from '../models/configuration';
import { CloudAppEventsService, CloudAppConfigService, AlertService, FormGroupUtil } from '@exlibris/exl-cloudapp-angular-lib';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { forkJoin, iif, Observable } from 'rxjs';
import { finalize, map, switchMap, tap } from 'rxjs/operators';
import { HostedConfigService } from './hosted-config.service';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {

  form: FormGroup;
  apikey: string;
  submitted = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private configService: CloudAppConfigService,
    private alert: AlertService,
    private hostedConfig: HostedConfigService,
  ) { }

  ngOnInit() {
    this.load();
  }

  load() {
    this.saving = true;
    forkJoin([
      this.configService.get(),
      this.hostedConfig.getConfig()
    ]).pipe(
      finalize(() => this.saving = false),
      tap(results => {
        this.form = FormGroupUtil.toFormGroup(Object.assign(new Configuration(), results[0]));
        this.apikey = results[1].alma_apikey;
      })
    )
    .subscribe({
      error: e => this.alert.error('An error occurred retrieving configuration: ' + e.message)
    })
  }    

  save() {
    this.submitted = true;
    if (!this.form.valid) return;
    this.saving = true;
    this.configService.set(this.form.value).pipe(
      finalize(() => this.saving = false),
      switchMap(() => iif(
        () => this.form.get('hosted').value, 
        this.hostedConfig.putConfig(Object.assign(this.form.value, { alma_apikey: this.apikey })),
        this.hostedConfig.deleteConfig()
      ))
    )
    .subscribe( response => {
      this.alert.success('Configuration saved.');
      this.form.markAsPristine();
      this.submitted = false;
      this.saving = false;
    },
    err => this.alert.error(err.message));
  }

  get hosted() {
    return this.form && this.form.get('hosted').value;
  }
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurationGuard implements CanActivate {
  constructor(
    private eventsService: CloudAppEventsService,
    private router: Router
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {
      return this.eventsService.getInitData().pipe(map( data => {
        if (!data.user.isAdmin) {
          this.router.navigate(['/']);
          return false;
        }
        return true;
      }))
  }
}