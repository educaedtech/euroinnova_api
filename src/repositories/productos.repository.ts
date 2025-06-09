/* eslint-disable @typescript-eslint/naming-convention */
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


  /**
   * Encuentra productos relacionados con un merchant específico y activos con paginación que no estan en shopify aún
   * @param merchantId ID del merchant
   * @param options Opciones de paginación y filtrado
   * @returns Promise con objeto que contiene los productos y el total
   */
  async findByMerchantWithoutSYNC(
    merchantId: number,
    options: {
      limit: number;
      offset: number;
      where?: any;
    }
  ): Promise<{products: ProductosWithRelations[], total: number}> {
    // 1. Obtener el total de unidades activas para el merchant (para paginación) que no estan en shopify aun

    const totalQuery = `SELECT count(p.unidad_id) as total FROM productos p JOIN (SELECT u.id,u.shopify_id FROM unidades u JOIN unidades_merchants um ON u.id=um.unidad_id AND um.activo=TRUE AND um.merchant_id= ?) uum ON p.unidad_id = uum.id AND uum.shopify_id IS NULL`;

    const totalResult = await this.dataSource.execute(totalQuery, [merchantId]);
    const total = totalResult[0]?.total ?? 0;

    if (total === 0) {
      return {products: [], total: 0};
    }

    // 2. Obtener las unidades activas paginadas
    const unidadesQuery = `
    SELECT p.unidad_id FROM productos p
    JOIN (SELECT u.id,u.shopify_id FROM unidades u JOIN unidades_merchants um ON u.id=um.unidad_id AND um.activo=TRUE AND um.merchant_id= ?) uum
    ON p.unidad_id = uum.id AND uum.shopify_id IS NULL
    LIMIT ? OFFSET ?
  `;
    const unidadesActivas = await this.dataSource.execute(
      unidadesQuery,
      [merchantId, options.limit, options.offset]
    );

    // 3. Extraer los IDs de las unidades
    const unidadIds = unidadesActivas.map((u: any) => u.unidad_id);

    // // 4. Buscar los productos por unidad_id
    // const whereClause = {
    //   ...options?.where,
    //   unidadId: {inq: unidadIds}
    // };

    // const productos = await this.find({
    //   where: whereClause,
    //   // No aplicamos limit/offset aquí porque ya lo hicimos a nivel de unidades
    // });

    // const productos = [];
    // 5. Cargar relaciones completas (similar a findByIdMine)
    const productosConRelaciones = await Promise.all(
      unidadIds.map((p: any) => this.findByIdMine(p))
    );

    return {
      products: productosConRelaciones,
      total: total
    };
  }

  /**
 * Encuentra productos relacionados con un merchant específico y activos con paginación
 * @param merchantId ID del merchant
 * @param options Opciones de paginación y filtrado
 * @returns Promise con objeto que contiene los productos y el total
 */
  async findByMerchantWithPagination(
    merchantId: number,
    options: {
      limit: number;
      offset: number;
      where?: any;
    }
  ): Promise<{products: ProductosWithRelations[], total: number}> {
    // 1. Obtener el total de unidades activas para el merchant (para paginación)
    const totalQuery = `
    SELECT COUNT(DISTINCT productos.unidad_id) as total
    FROM unidades_merchants
    JOIN productos ON productos.unidad_id = unidades_merchants.unidad_id
    WHERE merchant_id = ? AND activo = 1
  `;
    const totalResult = await this.dataSource.execute(totalQuery, [merchantId]);
    const total = totalResult[0]?.total ?? 0;

    if (total === 0) {
      return {products: [], total: 0};
    }

    // 2. Obtener las unidades activas paginadas
    const unidadesQuery = `
    SELECT DISTINCT productos.unidad_id
    FROM unidades_merchants
    JOIN productos ON productos.unidad_id = unidades_merchants.unidad_id
    WHERE merchant_id = ? AND activo = 1
    LIMIT ? OFFSET ?
  `;
    const unidadesActivas = await this.dataSource.execute(
      unidadesQuery,
      [merchantId, options.limit, options.offset]
    );

    // 3. Extraer los IDs de las unidades
    const unidadIds = unidadesActivas.map((u: any) => u.unidad_id);

    // 4. Buscar los productos por unidad_id
    const whereClause = {
      ...options?.where,
      unidadId: {inq: unidadIds}
    };

    const productos = await this.find({
      where: whereClause,
      // No aplicamos limit/offset aquí porque ya lo hicimos a nivel de unidades
    });

    // 5. Cargar relaciones completas (similar a findByIdMine)
    const productosConRelaciones = await Promise.all(
      productos.map(p => this.findByIdMine(p.unidadId))
    );

    return {
      products: productosConRelaciones,
      total: total
    };
  }


  /**
   * Encuentra productos relacionados con un merchant específico y activos
   * @param merchantId ID del merchant
   * @param filter Filtro opcional para los productos
   * @returns Promise con array de productos relacionados
   */
  async findByMerchant(
    merchantId: number,
    filter?: any,
  ): Promise<ProductosWithRelations[]> {
    // Primero obtenemos las unidades relacionadas con el merchant activo
    const unidadesActivas = await this.dataSource.execute(
      `SELECT DISTINCT productos.unidad_id
       FROM unidades_merchants JOIN productos ON productos.unidad_id = unidades_merchants.unidad_id
       WHERE merchant_id = ? AND activo = 1`,
      [merchantId]
    );

    console.log('unidadesActivas', unidadesActivas.length)

    if (!unidadesActivas || unidadesActivas.length === 0) {
      return [];
    }

    // Extraemos los IDs de las unidades
    const unidadIds = unidadesActivas.map((u: any) => u.unidad_id);

    // Creamos un filtro para buscar los productos por unidad_id
    const whereClause = {
      ...filter?.where,
      unidadId: {inq: unidadIds}
    };

    // console.log('where', whereClause)
    const productos = await this.find({
      ...filter,
      where: whereClause
    });


    // Si necesitas incluir las relaciones como en findByIdMine
    const productosConRelaciones = await Promise.all(
      productos.map(p => this.findByIdMine(p.unidadId))
    );

    return productosConRelaciones;
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

      producto.institucionesEducativasIds = institucionesIds;

      const extraDataQuery = `SELECT
          p.unidad_id AS producto_id,
          p.codigo,
          p.titulo,
          u.id AS unidad_id,
          u.activo AS unidad_activa,
          u.version_id,
          a.id AS area_id,
          a.nombre AS area_nombre,
          f.id AS facultad_id,
          f.nombre AS facultad_nombre,
          idio.id AS idioma_id,
          a.shopify_id AS area_shopify,
          f.shopify_id AS facultad_shopify,
          ne.shopify_id AS nivel_educativo_shopify,
          idio.shopify_id AS idioma_shopify,
          idio.nombre AS idioma_nombre,
          u.shopify_id,
          u.syncro_data,
          (
              SELECT JSON_ARRAYAGG(cp.shopify_id)
              FROM productos_creditos_productos pc
              JOIN creditos_productos cp ON cp.id = pc.credito_producto_id
              WHERE pc.producto_id = p.unidad_id
          ) AS creditos_productos_shopify,
          ut.nombre AS unidad_tiempo,
          md.nombre AS modalidad,
          es.shopify_id AS escuela_shopify,
          (
              SELECT GROUP_CONCAT(CONCAT(pc.numero_creditos, ' ',cp.codigo ) SEPARATOR ', ')
              FROM productos_creditos_productos pc
              JOIN creditos_productos cp ON cp.id = pc.credito_producto_id
              WHERE pc.producto_id = p.unidad_id
          ) AS creditos,
          (
              SELECT NULLIF(JSON_ARRAYAGG(NULLIF(im.url, NULL)), JSON_ARRAY(NULL))
              FROM unidades_merchants_imagenes ui
              JOIN imagenes im ON ui.imagen_id = im.id AND im.tipo_id=1
              WHERE ui.unidad_id = p.unidad_id
          ) AS url_imagenes_logos,
          (
              SELECT NULLIF(JSON_ARRAYAGG(NULLIF(im.url, NULL)), JSON_ARRAY(NULL))
              FROM unidades_merchants_imagenes ui
              JOIN imagenes im ON ui.imagen_id = im.id AND im.tipo_id=2
              WHERE ui.unidad_id = p.unidad_id
          ) AS url_imagenes_diplomas,
					(SELECT
						NULLIF(
							(
								SELECT JSON_ARRAYAGG(shopify_id)
								FROM (
									SELECT un.shopify_id
									FROM unidades_unidades_relacionadas uur
									JOIN productos pd ON uur.unidad_relacionada_id = pd.unidad_id
									JOIN unidades un ON un.id = pd.unidad_id
									WHERE uur.unidad_id = p.unidad_id
										AND uur.tipo_relacion_id = 1
										AND un.shopify_id IS NOT NULL
								) filtered
							),
							JSON_ARRAY(NULL)
						) ) as productos_relacionados_idioma,
					(
							SELECT NULLIF(JSON_ARRAYAGG(NULLIF(tmp.shopify_id, NULL)), JSON_ARRAY(NULL))
							FROM (
									SELECT DISTINCT idm.shopify_id
									FROM unidades_unidades_relacionadas uur
									JOIN productos pd ON uur.unidad_relacionada_id = pd.unidad_id
									JOIN idiomas idm ON pd.idioma_contenido_id = idm.id
									WHERE uur.unidad_id = p.unidad_id AND uur.tipo_relacion_id = 1
							) tmp
					) as idiomas_relacionados,

					CONCAT_WS(', ','AREAS',
              a.nombre,
              'FACULTADES',
              f.nombre,'NIVELES EDUCATIVOS',
              ne.nombre
          ) AS colecciones_shopify

      FROM productos p
      LEFT JOIN unidades u ON p.unidad_id = u.id
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN facultades f ON u.facultad_id = f.id
      LEFT JOIN niveles_educativos ne ON u.nivel_educativo_id = ne.id
      LEFT JOIN idiomas idio ON p.idioma_contenido_id = idio.id
      LEFT JOIN unidades_tiempo ut ON ut.id = p.unidad_tiempo_id
      LEFT JOIN modalidades md ON md.id = p.modalidad_id
      LEFT JOIN escuelas es ON es.id = u.escuela_id
      WHERE p.unidad_id = ?;`;

      const extraData = await this.dataSource.execute(
        extraDataQuery,
        [producto.unidadId],
      );

      // console.log(extraData)

      const {shopify_id, syncro_data, colecciones_shopify, idiomas_relacionados, productos_relacionados_idioma, url_imagenes_diplomas, url_imagenes_logos, creditos, idioma_nombre, escuela_shopify, modalidad, area_shopify, facultad_shopify, nivel_educativo_shopify, idioma_shopify, creditos_productos_shopify, unidad_tiempo} = extraData[0] ?? {area_shopify: null, facultad_shopify: null, nivel_educativo_shopify: null, idioma_shopify: null};

      producto.extraData = {shopify_id, syncro_data, colecciones_shopify, idiomas_relacionados, productos_relacionados_idioma, url_imagenes_diplomas, url_imagenes_logos, creditos, idioma_nombre, escuela_shopify, modalidad, area_shopify, facultad_shopify, nivel_educativo_shopify, idioma_shopify, creditos_productos_shopify, unidad_tiempo};
      // console.log('extraData', extraData);

    }

    // Retornar un objeto combinado sin modificar el modelo original
    return producto;
  }



}
