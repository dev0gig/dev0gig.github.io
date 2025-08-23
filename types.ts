

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

// External Projects Types
export interface ExternalProjectItem {
  name: string;
  url: string;
  icon: string;
  description: string;
}

// Weather Widget Types
export interface WeatherData {
  temperature: number;
  location: string;
  icon: string;
}

// AuriMea Types
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  name: string;
  color: string; // e.g. 'bg-violet-500'
  ringColor: string; // e.g. 'focus:ring-violet-500'
  borderColor: string; // e.g. 'border-violet-500/50'
  accentColor: string; // e.g. 'text-violet-400'
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  createdAt: string; // ISO String
  transferId?: string;
}

export interface TransactionTemplate {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
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

export interface ExternalProjectTile extends BaseTile {
    type: 'EXTERNAL_PROJECT';
    project: ExternalProjectItem;
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

export type Tile = MyProjectTile | ExternalProjectTile | AppLinkTile | ViewLinkTile | DateTimeTile;