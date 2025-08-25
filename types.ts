


export enum View {
  Apps,
  MyProjects,
  New,
  ExternalProjects,
}

export enum MyProject {
  MemoMea = 'MemoMea',
  ReadLateR = 'ReadLateR',
  CollMea = 'CollMea',
  AuriMea = 'AuriMea',
  FWDaten = 'FWDaten',
  Flashcards = 'Flashcards',
}

export interface AppItem {
  id: string;
  iconUrl: string;
  targetUrl: string;
  ariaLabel: string;
  isFavorite: boolean;
}

export interface JournalEntry {
  id:string;
  content: string;
  createdAt: string; // ISO String
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  entryId: string;
  entryCreatedAt: string;
}

export interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  imageUrl: string;
  createdAt: string; // ISO String
  isArchived: boolean;
}

export interface ExternalProjectItem {
  name: string;
  icon: string;
  description: string;
  url: string;
}

// CollMea Types
export interface GenericListItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  icon: string; // Material symbol name
  type: 'GenericList';
  createdAt: string;
  items: GenericListItem[];
}

// Flashcards Types
export interface Flashcard {
  front: string;
  back: string;
}
export type FlashcardDeck = Flashcard[];


// Weather Widget Types
export interface WeatherData {
  temperature: number;
  location: string;
  icon: string;
}

// Metro Tile Types for Mobile View
export type TileSize = '1x1' | '2x1' | '2x2';

export interface BaseTile {
    id: string; // Unique ID
    size: TileSize;
    color: string; // Tailwind bg color class
    order: number;
}

export interface MyProjectTile extends BaseTile {
    type: 'MY_PROJECT';
    projectId: MyProject;
}

export interface AppLinkTile extends BaseTile {
    type: 'APP_LINK';
    app: AppItem;
}

export interface ViewLinkTile extends BaseTile {
    type: 'VIEW_LINK';
    viewId: View;
    label: string;
    icon: string;
}

export interface DateTimeTile extends BaseTile {
    type: 'DATETIME';
}

export interface ExternalProjectTile extends BaseTile {
    type: 'EXTERNAL_PROJECT';
    project: ExternalProjectItem;
}

export type Tile = MyProjectTile | AppLinkTile | ViewLinkTile | DateTimeTile | ExternalProjectTile;