
export enum View {
  MyProjects,
}

export enum MyProject {
  MemoMea = 'MemoMea',
  AuriMea = 'AuriMea',
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

// FIX: Added missing AppItem, BookmarkItem, Collection, and GenericListItem types to resolve compilation errors.
// App Management Types
export interface AppItem {
  id: string;
  ariaLabel: string;
  targetUrl: string;
  iconUrl: string;
  isFavorite: boolean;
}

// ReadLater Types
export interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  imageUrl: string;
  createdAt: string; // ISO String
  isArchived: boolean;
}

// CollMea (Collections) Types
export interface GenericListItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string; // ISO String
}

export interface Collection {
  id: string;
  name: string;
  icon: string;
  type: 'GenericList';
  createdAt: string; // ISO String
  items: GenericListItem[];
}

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

export interface DateTimeTile extends BaseTile {
    type: 'DATETIME';
}

// FIX: Added missing tile types to resolve compilation errors.
export interface ViewLinkTile extends BaseTile {
    type: 'VIEW_LINK';
    viewId: View;
    icon: string;
    label: string;
}

export interface AppLinkTile extends BaseTile {
    type: 'APP_LINK';
    app: AppItem;
}

export type Tile = MyProjectTile | DateTimeTile | ViewLinkTile | AppLinkTile;

// FIX: Added missing Flashcard and FlashcardDeck type definitions.
// Flashcard Types
export interface Flashcard {
  front: string;
  back: string;
}

export type FlashcardDeck = Flashcard[];
