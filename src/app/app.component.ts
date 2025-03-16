import { Component } from '@angular/core';
import { Sample1Component } from './samples/sample1.component';
import { Ng2MultiModalService } from '../../projects/ng2-multi-modal/src/public-api';

@Component({
  selector: 'app-root',
  imports: [Sample1Component],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'proyect-multi-modal';
  constructor(private _modal: Ng2MultiModalService) {
    this._modal.language = 'en';
  }
}
