import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Productos,CreditosProductos} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'productos_creditos_productos'},
    foreignKeys: {
      eduseoProductosCreditosProductosBfkRel: {
        name: 'eduseoProductosCreditosProductosBfkRel',
        entity: 'Productos',
        entityKey: 'unidadId',
        foreignKey: 'productoId'
      },
      productosCreditosProductosIbfk_2Rel: {
        name: 'productosCreditosProductosIbfk_2Rel',
        entity: 'CreditosProductos',
        entityKey: 'id',
        foreignKey: 'creditoProductoId'
      }
    }
  }
})
export class ProductosCreditosProductos extends Entity {
  @belongsTo(() => Productos)
  productoId: number;

  @belongsTo(() => CreditosProductos)
  creditoProductoId: number;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 12,
    generated: false,
    mysql: {columnName: 'numero_creditos', dataType: 'float', dataLength: null, dataPrecision: 12, dataScale: null, nullable: 'Y', generated: false},
  })
  numeroCreditos?: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'convalidacion', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  convalidacion?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ProductosCreditosProductos>) {
    super(data);
  }
}

export interface ProductosCreditosProductosRelations {
  // describe navigational properties here
}

export type ProductosCreditosProductosWithRelations = ProductosCreditosProductos & ProductosCreditosProductosRelations;
