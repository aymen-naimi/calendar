import { Component, OnInit, HostListener } from '@angular/core';
import { Meeting, MeetingEvent, MeetingCSS } from './models/models';
import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  meetings: Meeting[] = [];
  meetingsCss: MeetingCSS[] = [];
  meetingsEvents: MeetingEvent[] = [];
  nbColumnsMap: Map<number, number> = new Map();
  isCalendarReady: boolean = false;

  @HostListener('window:resize', ['$event']) onResize(event: any) {
    this.meetingsCss.forEach(meet => {
      meet.height = this.dataService.getNewHeight(meet, event.target.innerHeight)
    });
  }

  constructor
    (private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.getData().subscribe((data: Meeting[]) => {
      this.meetings = data;
      this.initData();
    });
  }

  initData() {
    // meetingsCss used to display meetings
    this.meetingsCss = this.dataService.initMeetingsCss(this.meetings);

    // for each meeting we have 2 events (start and end)
    this.meetingsEvents = this.dataService.initMeetingsEvents(this.meetings);

    // nbColumn = n    =>    (width = 100 / n) %
    this.nbColumnsMap = this.dataService.initNbColumnsMap(this.meetingsEvents);

    this.dataService.setNbcolumns(this.meetingsCss, this.meetingsEvents, this.nbColumnsMap);

    while (this.dataService.isCalendarDisplayNotValid(this.meetingsEvents)) {
      this.dataService.getNextDisplayPosition(this.meetingsEvents, this.meetingsCss);
    }

    this.isCalendarReady = true;
  }
}
