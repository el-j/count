export interface CounterEntry {
  id: string;
  time: string;
  iso: string;
  delta: number;
  resultingTotal: number;
  label: string;
}

export interface CounterState {
  count: number;
  target: number;
  stationName: string;
  recipientEmail: string;
  history: CounterEntry[];
  startTime: string;
}
