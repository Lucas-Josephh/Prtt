import { Component, Input } from '@angular/core';

@Component({
  selector: 'svg-people',
  imports: [],
  templateUrl: './people.component.html',
})

export class PeopleVGComponent {
  @Input() size = 18;
}
