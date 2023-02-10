export interface Meeting {
    id: number;
    duration: number;
    start: string;
  }
  
  export interface MeetingEvent {
    id: number;
    type: ('START' | 'END');
    time: number;
    nbcolumns: number;
    position: number
  }
  
  export interface MeetingCSS {
    width: number;
    duration: number;
    marginLeft: number;
    top: number;
    height: number;
    id: number;
    nbColumns: number;
    position: number;
  }

  export interface Interval {
    id: number;
    rang: [number, number];
  }

  export class Constants {
    public static START ='START';
    public static END ='END';
 }
 