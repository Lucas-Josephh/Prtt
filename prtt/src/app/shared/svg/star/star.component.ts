import { Component, Input } from '@angular/core';

@Component({
  selector: 'svg-star',
  imports: [],
  templateUrl: './star.component.html',
})

export class StarSVGComponent {
  @Input() size = 18;
}
