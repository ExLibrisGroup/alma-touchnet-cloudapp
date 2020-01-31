import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Configuration } from '../models/configuration';
import { CloudAppSettingsService } from '@exlibris/exl-cloudapp-angular-lib';
import { ToastrService } from 'ngx-toastr';
import { Utils } from '../utilities';

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
    private settingsService: CloudAppSettingsService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.form = this.fb.group(new Configuration());
    this.load();
  }

  load() {
    this.settingsService.getAsFormGroup().subscribe( configuration => {
      if (!Utils.isEmptyObject(configuration.value)) this.form = configuration;
    });    
  }    

  save() {
    this.submitted = true;
    if (!this.form.valid) return;
    this.saving = true;
    this.settingsService.set(this.form.value).subscribe( response => {
      this.toastr.success('Configuration saved.');
      this.form.markAsPristine();
      this.submitted = false;
      this.saving = false;
    },
    err => this.toastr.error(err.message));
  }

}
