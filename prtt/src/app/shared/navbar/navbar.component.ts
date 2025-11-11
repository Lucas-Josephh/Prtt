import { Component, Input } from '@angular/core';
import { HouseSVGComponent } from '../svg/house/house.component';
import { NewsPaperSVGComponent } from '../svg/newspaper/newspaper.component';
import { StarSVGComponent } from '../svg/star/star.component';
import { PeopleVGComponent } from '../svg/people/people.component';
import { CalendarSVGComponent } from '../svg/calendar/calendar.component';
import { CupSVGComponent } from '../svg/cup/cup.component';
import { InfosSVGComponent } from '../svg/infos/infos.component';

@Component({
  selector: 'extranet-navbar',
  imports: [HouseSVGComponent, NewsPaperSVGComponent, StarSVGComponent, PeopleVGComponent, CalendarSVGComponent, CupSVGComponent, InfosSVGComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})

export class NavbarComponent {
  @Input() page = "home";
}
