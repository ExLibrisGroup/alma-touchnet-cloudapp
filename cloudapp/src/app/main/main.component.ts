import { Component, OnInit, OnDestroy, HostListener, Injectable } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CloudAppEventsService, CloudAppRestService, AlertService, PageInfo, Request, HttpMethod, CloudAppConfigService } from '@exlibris/exl-cloudapp-angular-lib';
import { environment } from '../../environments/environment';
import { User } from '../models/user';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Configuration } from '../models/configuration';

const WINDOW_PROPS = "width=750,height=500,resizable,";

@Component({
  selector: 'app-touchnet',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  user: User;
  private pageLoad$: Subscription;
  isLoading: boolean;
  configuration: Configuration;

  constructor(
    private restService: CloudAppRestService, 
    private eventsService: CloudAppEventsService,
    private configService: CloudAppConfigService,
    private alert: AlertService
    ) { }

  ngOnInit(): void {
    this.eventsService.getPageMetadata().subscribe(this.onPageLoad);
    this.pageLoad$ = this.eventsService.onPageLoad(this.onPageLoad);
    this.configService.get().subscribe(config => this.configuration = config as Configuration);
  }

  onPageLoad = (pageInfo: PageInfo) => {
    const entities = (pageInfo.entities||[]).filter(e=>e.type=='USER');
    if (entities.length == 1) {
      this.loadUser(entities[0].link);
    } else {
      this.user = null;
    }
  }

  loadUser(link?: string) {
    this.isLoading = true;
    if (!link) link = `/users/${this.user.primary_id}`;
    this.restService.call(`${link}?expand=fees`)
      .subscribe({
        next: response => this.user = response as User,
        complete: () => this.isLoading = false
       })
  }

  pay() {
    const options = Object.assign(this.configuration, { 
      user_id: this.user.primary_id,
      total_sum: this.user.fees.value
    });
    window.open(environment.touchnetService + "/touchnet?s=" + btoa(JSON.stringify(options)) , "_blank", WINDOW_PROPS);
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    if (event.data.amount && event.data.external_transaction_id) {
      const { amount, external_transaction_id } = event.data;
      let request: Request = { 
        url: `/users/${this.user.primary_id}/fees/all`,
        method: HttpMethod.POST,
        queryParams: {
          op: "pay",
          amount: amount,
          method: "ONLINE",
          external_transaction_id: external_transaction_id
        }
      }
      this.isLoading = true;
      this.restService.call(request).subscribe(
        resp => { 
          this.alert.success(`Payment of ${amount} successfully posted.`);
          this.refreshPage(); 
        },
        err => this.alert.error(`Could not post payment of ${amount}: ${err.message}`),
        () => this.isLoading = false
      );
    }
  }

  refreshPage() {
    this.eventsService.refreshPage().subscribe(() => this.loadUser());
  }

  ngOnDestroy(): void {
    this.pageLoad$.unsubscribe();
  }  
}

@Injectable({
  providedIn: 'root',
})
export class MainGuard implements CanActivate {
  constructor(
    private configService: CloudAppConfigService,
    private router: Router
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {
      return this.configService.get().pipe( map( config => {
        if (!config.upay_site_id) {
          this.router.navigate(['/errors/noconfig']);
          return false;
        }
        return true;
      }))
  }
}