export type RecordBody = [string, string]

export interface Record {
  id: string
  content: RecordBody
  path: string
}
