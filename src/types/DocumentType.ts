export type Page = {
  lines: Line[]
}

export type Line = {
  cols: Col[]
}

export type Col = {
  value?: string
  isEOL?: boolean
}

export enum UpdateOrigin {
  HISTORY = 'history',
  USER = 'user',
  LOAD = 'load',
  REMOTE = 'remote',
}

export type Document = {
  pages?: Page[]
  lines: Line[]
  updateOrigin?: UpdateOrigin
}
