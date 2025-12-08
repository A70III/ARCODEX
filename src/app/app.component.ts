import { Component } from "@angular/core";
import { MainLayoutComponent } from "./components/main-layout/main-layout.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [MainLayoutComponent],
  template: `<app-main-layout />`,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
    }
  `]
})
export class AppComponent {}
