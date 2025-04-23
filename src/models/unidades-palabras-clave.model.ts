import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Unidades,PalabrasClave} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'unidades_palabras_clave'},
    foreignKeys: {
      unidadesPalabrasClaveIbfk_1Rel: {
        name: 'unidadesPalabrasClaveIbfk_1Rel',
        entity: 'Unidades',
        entityKey: 'id',
        foreignKey: 'unidadId'
      },
      unidadesPalabrasClaveIbfk_2Rel: {
        name: 'unidadesPalabrasClaveIbfk_2Rel',
        entity: 'PalabrasClave',
        entityKey: 'id',
        foreignKey: 'palabrasClaveId'
      }
    }
  }
})
export class UnidadesPalabrasClave extends Entity {
  @belongsTo(() => Unidades)
  unidadId: number;

  @belongsTo(() => PalabrasClave)
  palabrasClaveId: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<UnidadesPalabrasClave>) {
    super(data);
  }
}

export interface UnidadesPalabrasClaveRelations {
  // describe navigational properties here
}

export type UnidadesPalabrasClaveWithRelations = UnidadesPalabrasClave & UnidadesPalabrasClaveRelations;
