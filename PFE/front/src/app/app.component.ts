import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private router: Router, private titleService: Title) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let child = this.router.routerState.root;
        while (child.firstChild) {
          child = child.firstChild;
        }
        return child.snapshot.data['title'] || 'ZaiDash Plus';
      })
    ).subscribe(title => {
      this.titleService.setTitle(title);
    });
  }
}
