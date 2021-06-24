import { Component, OnInit, Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Configuration } from '../models/configuration';
import { CloudAppEventsService, CloudAppConfigService, AlertService, FormGroupUtil } from '@exlibris/exl-cloudapp-angular-lib';
import { Utils } from '../utilities';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {

  form: FormGroup;
  submitted = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private configService: CloudAppConfigService,
    private alert: AlertService
  ) { }

  ngOnInit() {
    this.load();
  }

  load() {
    this.configService.get().subscribe( configuration => {
      this.form = FormGroupUtil.toFormGroup(Object.assign(new Configuration(), configuration));
    });    
  }    

  save() {
    this.submitted = true;
    if (!this.form.valid) return;
    this.saving = true;
    this.configService.set(this.form.value).subscribe( response => {
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