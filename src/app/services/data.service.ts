import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Meeting, MeetingEvent, MeetingCSS, Interval, Constants } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(
    private httpClient: HttpClient
  ) { }

  getData(): Observable<Meeting[]> {
    return this.httpClient.get<Meeting[]>('/assets/data/input.json')
  }

  setNbcolumns(meetingsCss: MeetingCSS[], meetingsEvents: MeetingEvent[], nbColumnsMap: Map<number, number>) {
    meetingsCss.forEach(meet => {
      meet.nbColumns = nbColumnsMap.get(meet.id) as number;
      meet.position = 1;
      meet.width = 100 / (nbColumnsMap.get(meet.id) as number);
    });

    meetingsEvents.forEach(meetData => {
      meetData.nbcolumns = nbColumnsMap.get(meetData.id) as number;
      meetData.position = 1;
    });
  }

  initMeetingsCss(meetings: Meeting[]): MeetingCSS[] {
    return meetings.map(meeting => ({
      width: 0, // will be calculate later
      marginLeft: 0, // will be calculate later
      top: this.getTop(meeting), // in % // top = 0 for meeting started at 9h00
      duration: meeting.duration, // in min
      height: this.getFirstHeight(meeting), // in px
      id: meeting.id,
      nbColumns: 0, // will be caculate later // nbColumn = n    =>    (width = 100 / n) %
      position: 0, /// will be caculate later // position will be beteen 1 and n   =>   (margin-left : (position-1) / nbColumn) * 100  %
    }));
  }

  initNbColumnsMap(meetingsEventsSource: MeetingEvent[]) {
    const meetingsEvents = JSON.parse(JSON.stringify(meetingsEventsSource));
    const inProgessMap = new Map();
    const nbColumnsMap = new Map();
    let buffer: MeetingEvent[] = this.readFromMeetingData(meetingsEvents);
    let oldnbColumns: number = 0;
    while (buffer.length) {
      let newnbcolumns = this.getNewNbColums(oldnbColumns, buffer);
      let buffersIds = this.getBuffersIds(buffer);

      buffer.forEach((meet) => {
        if (meet.type === Constants.END) {
          nbColumnsMap.set(meet.id, Math.max(oldnbColumns, inProgessMap.get(meet.id)));
          inProgessMap.delete(meet.id);
        } else if (meet.type === Constants.START) {
          inProgessMap.set(meet.id, newnbcolumns);
        }
      });

      inProgessMap.forEach((nbCol, id) => {
        if (!buffersIds.has(id)) {
          inProgessMap.set(id, Math.max(nbCol, newnbcolumns))
        }
      })

      buffer = this.readFromMeetingData(meetingsEvents);
      oldnbColumns = newnbcolumns
    }
    return nbColumnsMap;
  }

  initMeetingsEvents(meetings: Meeting[]): MeetingEvent[] {
    const meetingsEvents: MeetingEvent[] = meetings.flatMap((meeting) => {

      const [hours, minutes] = meeting.start.split(':');
      const startTime = (parseInt(hours) - 9) * 60 + parseInt(minutes);
      const endtime = startTime + meeting.duration

      return [
        { id: meeting.id, type: 'START', time: startTime, nbcolumns: 0, position: 0 },
        { id: meeting.id, type: 'END', time: endtime, nbcolumns: 0, position: 0 }
      ]
    });

    meetingsEvents.sort((meeting1, meeting2) => {
      if (meeting1.time !== meeting2.time) {
        return meeting1.time - meeting2.time;
      } else if (meeting1.type === meeting2.type) {
        return (meeting1.type === Constants.START) ? 1 : -1;
      } else {
        return 0;
      }
    });
    return meetingsEvents;
  }

  getNewNbColums(nbColumns: number, buffer: MeetingEvent[]): number {
    return buffer.reduce((acc, meet) => {
      return (meet.type === Constants.START) ? (acc + 1) : (acc - 1);
    }, nbColumns)
  }

  getBuffersIds(buffer: MeetingEvent[]) {
    return new Set(buffer.map(buf => buf.id));
  }

  readFromMeetingData(meetingsData: MeetingEvent[]) {
    let result: MeetingEvent[] = [];
    if (meetingsData.length) {
      result.push(meetingsData.shift() as MeetingEvent);
    }
    while (meetingsData.length && (meetingsData[0].time === result[0].time)) {
      result.push(meetingsData.shift() as MeetingEvent);
    }
    return result;
  }


  getTop(meeting: Meeting) {
    const [hours, minutes] = meeting.start.split(':');
    return ((parseInt(hours) - 9) * 60 + parseInt(minutes)) * 100 / (12 * 60);
  }

  getFirstHeight(meeting: Meeting) {
    return meeting.duration * window.innerHeight / (12 * 60);
  }

  getNewHeight(meeting: MeetingCSS, globalHeight: number) {
    return meeting.duration * globalHeight / (12 * 60);
  }

  isCalendarDisplayNotValid(meetingsEventsCopy: MeetingEvent[]): boolean {
    const array: MeetingEvent[] = JSON.parse(JSON.stringify(meetingsEventsCopy));
    const inProgessMap = new Map();
    let calendarNotValid: boolean = false;
    let buffer: MeetingEvent[]
    do {
      buffer = this.readFromMeetingData(array);
      buffer.forEach(b => {
        if (b.type === Constants.START) {
          inProgessMap.set(b.id, b);
        } else if (b.type === Constants.END) {
          inProgessMap.delete(b.id)
        }
      });
      calendarNotValid = calendarNotValid || this.checkIfMapNotValid(inProgessMap);
    } while (buffer.length);

    return calendarNotValid;
  }

  getNextDisplayPosition(meetingsEvents: MeetingEvent[], meetingsCss: MeetingCSS[]) {
    let elementToMoveFound: boolean = false;
    let indexElementToMove: number = -1;

    meetingsEvents.forEach(((element, index) => {
      if ((element.nbcolumns > 1) && (element.type === Constants.START)) {
        if ((element.position < element.nbcolumns) && !elementToMoveFound) {
          element.position = element.position + 1;
          elementToMoveFound = true;
          indexElementToMove = index;
        }
      }
    }));

    meetingsEvents.forEach(((element, index) => {
      if ((element.nbcolumns > 1) && (element.type === Constants.START)) {
        if (index < indexElementToMove) {
          element.position = 1;
        }
      }
    }));

    let mapToTransfertData = new Map();

    meetingsEvents.forEach(element => {
      if ((element.nbcolumns > 1) && (element.type === Constants.START)) {
        mapToTransfertData.set(element.id, element);
      }
    });

    meetingsCss.forEach(element => {
      if (mapToTransfertData.has(element.id)) {
        element.position = mapToTransfertData.get(element.id).position;
        element.marginLeft = ((element.position - 1) / element.nbColumns * 100);
      }
    });
  }

  checkIfMapNotValid(inProgessMap: Map<number, MeetingEvent>) {
    const intervals: Interval[] = [];
    inProgessMap.forEach((event: MeetingEvent, id: number) => {
      intervals.push({ id: id, rang: [(event.position - 1) / event.nbcolumns, (event.position) / event.nbcolumns] });
    });

    var interstions: boolean = false;

    intervals.forEach(rang1 => {
      intervals.forEach(rang2 => {
        interstions = interstions || (rang1.id !== rang2.id)
          && !((rang1.rang[0] >= rang2.rang[1]) || (rang1.rang[1] <= rang2.rang[0]));
      });
    });
    return interstions;
  }  
}
