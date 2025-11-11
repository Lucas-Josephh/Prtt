import { Component, Input } from '@angular/core';

@Component({
  selector: 'svg-calendar',
  imports: [],
  templateUrl: './calendar.component.html',
})

export class CalendarSVGComponent {
  @Input() size = 18;
}
