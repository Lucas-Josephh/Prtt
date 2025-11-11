import { Component, Input } from '@angular/core';

@Component({
  selector: 'svg-cup',
  imports: [],
  templateUrl: './cup.component.html',
})

export class CupSVGComponent {
  @Input() size = 18;
}
