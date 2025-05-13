/* eslint-disable @typescript-eslint/no-explicit-any */
import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Productos, ProductosRelations, ProductosWithRelations} from '../models';

export class ProductosRepository extends DefaultCrudRepository<
  Productos,
  typeof Productos.prototype.unidad_id,
  ProductosRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Productos, dataSource);
  }


  async findByIdMine(
    id: typeof Productos.prototype.id,
    filter?: any,
    options?: any,
  ): Promise<ProductosWithRelations> {
    // Obtener el producto base SIN incluir propiedades no mapeadas
    const producto = await super.findById(id, filter,);

    // Obtener instituciones educativas
    let institucionesIds: string[] = [];
    if (producto.unidadId) {
      const instituciones = await this.dataSource.execute(
        `SELECT
            institucion_educativa_id,
            instituciones_educativas.shopify_id
          FROM
            unidades_instituciones_educativas
            INNER JOIN instituciones_educativas ON unidades_instituciones_educativas.institucion_educativa_id = instituciones_educativas.id
            AND unidades_instituciones_educativas.unidad_id = ?`,
        [producto.unidadId],
      );
      institucionesIds = instituciones.map((i: any) => i.shopify_id /*i.institucion_educativa_id*/) || [];
      producto.institucionesEducativasIds = institucionesIds
    }

    // Retornar un objeto combinado sin modificar el modelo original
    return producto;
  }



}
