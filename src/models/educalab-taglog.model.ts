import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {idInjection: false, mysql: {schema: 'productos', table: 'educalab_taglog'}}
})
export class EducalabTaglog extends Entity {
  @property({
    type: 'number',
    required: true,
    jsonSchema: {nullable: false},
    precision: 10,
    scale: 0,
    generated: false,
    id: 1,
    mysql: {columnName: 'tag', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'N', generated: false},
  })
  tag: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'snapshot', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  snapshot?: string;

  @property({
    type: 'date',
    jsonSchema: {nullable: true},
    generated: false,
    mysql: {columnName: 'last_updated', dataType: 'datetime', dataLength: null, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  lastUpdated?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<EducalabTaglog>) {
    super(data);
  }
}

export interface EducalabTaglogRelations {
  // describe navigational properties here
}

export type EducalabTaglogWithRelations = EducalabTaglog & EducalabTaglogRelations;
