export interface Meter {
  id: string;
  number: string;
  purpose: string;
  location: string;
}

export interface Reading {
  id: string;
  meterId: string;
  date: string; // ISO String for date
  value: number;
}
