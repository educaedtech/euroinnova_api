import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {idInjection: false, mysql: {schema: 'productos', table: 'creditos_productos'}}
})
export class CreditosProductos extends Entity {
  @property({
    type: 'number',
    jsonSchema: {nullable: false},
    precision: 10,
    scale: 0,
    generated: 1,
    id: 1,
    mysql: {columnName: 'id', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'N', generated: 1},
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {nullable: false},
    length: 50,
    generated: false,
    index: {unique: true},
    mysql: {columnName: 'codigo', dataType: 'varchar', dataLength: 50, dataPrecision: null, dataScale: null, nullable: 'N', generated: false},
  })
  codigo: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {nullable: false},
    length: 65535,
    generated: false,
    mysql: {columnName: 'nombre', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'N', generated: false},
  })
  nombre: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'descripcion', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  descripcion?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<CreditosProductos>) {
    super(data);
  }
}

export interface CreditosProductosRelations {
  // describe navigational properties here
}

export type CreditosProductosWithRelations = CreditosProductos & CreditosProductosRelations;
