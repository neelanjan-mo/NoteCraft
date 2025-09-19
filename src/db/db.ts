import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { JSONContent } from '@tiptap/core';

export interface Folder {
    id: string;
    parentId: string | null;
    name: string;
    createdAt: number;
    updatedAt: number;
    sort: number;
}

export interface Page {
    id: string;
    folderId: string | null;
    title: string;
    createdAt: number;
    updatedAt: number;
}

export type BlockType =
    | 'heading'
    | 'paragraph'
    | 'bullet_list'
    | 'ordered_list'
    | 'task_item';

export interface Block {
    id: string;
    pageId: string;
    type: BlockType;
    contentJSON: JSONContent;
    order: number;
    updatedAt: number;
}

export class NotesDB extends Dexie {
    folders!: Table<Folder, string>;
    pages!: Table<Page, string>;
    blocks!: Table<Block, string>;
    constructor() {
        super('notecraft_v1');
        this.version(1).stores({
            folders: 'id, parentId, updatedAt, sort',
            pages: 'id, folderId, updatedAt, title',
            blocks: 'id, pageId, order, updatedAt',
        });
    }
}

export const db = new NotesDB();
