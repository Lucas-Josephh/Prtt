import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { JoinSVGComponent } from '../../shared/svg/join/join.component';
import { PeopleVGComponent } from '../../shared/svg/people/people.component';
import { CupSVGComponent } from '../../shared/svg/cup/cup.component';
import { CalendarSVGComponent } from '../../shared/svg/calendar/calendar.component';
import { StarSVGComponent } from '../../shared/svg/star/star.component';

@Component({
  selector: 'app-home',
  imports: [NavbarComponent, JoinSVGComponent, PeopleVGComponent, CupSVGComponent, CalendarSVGComponent, StarSVGComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})

export class HomeComponent {}
