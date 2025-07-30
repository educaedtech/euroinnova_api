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



  async findModfiedByHoursRange(
    merchantId: number,
    options: {
      limit: number;
      offset: number;
      where?: any;
      hours?: number;
    }
  ): Promise<{total: number, actives: number, inactives: number}> {


    const unidadesQuery = `
        SELECT DISTINCT
          u.id AS unidad_id,
          um.activo,(
          SELECT
            rfu.shopify_id
          FROM
            productos.references_data_unidad rfu
          WHERE
            rfu.unidad_id = u.id
            AND rfu.merchant_id = um.merchant_id
          ) AS shopify_id
        FROM
          productos.unidades_merchants um
          JOIN productos.unidades u ON u.id = um.unidad_id
          JOIN productos.productos p ON p.unidad_id = u.id
          AND um.merchant_id = ?
          AND u.fecha_actualizacion >= DATE_SUB( NOW(), INTERVAL ? HOUR )`;

    const unidades2procces = await this.dataSource.execute(
      unidadesQuery,
      [merchantId, options.hours]
    );
    // 3. Extraer los IDs de las unidades
    const unidadIds = unidades2procces.filter((p: {unidad_id: number, activo: number; shopify_id: string}) => p.activo === 1).map((u: any) => u.unidad_id);
    // console.log(unidadIds);
    // 3. Extraer los IDs de las unidades
    const inactiveIds = unidades2procces.filter((p: {unidad_id: number, activo: number; shopify_id: string}) => p.activo === 0).map((u: any) => u.shopify_id);


    return {total: unidades2procces.length, actives: unidadIds.length, inactives: inactiveIds.length}

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
      hours?: number;
    }
  ): Promise<{products: {unidadId: number, merchantId: number}[] /*ProductosWithRelations[]*/, total: number, inactives: string[]}> {


    const unidadesQuery = `
        SELECT DISTINCT
          u.id AS unidad_id,
          um.activo,(
          SELECT
            rfu.shopify_id
          FROM
            productos.references_data_unidad rfu
          WHERE
            rfu.unidad_id = u.id
            AND rfu.merchant_id = um.merchant_id
          ) AS shopify_id
        FROM
          productos.unidades_merchants um
          JOIN productos.unidades u ON u.id = um.unidad_id
          JOIN productos.productos p ON p.unidad_id = u.id
          AND um.merchant_id = ?
          AND u.fecha_actualizacion >= DATE_SUB( NOW(), INTERVAL ? HOUR )
          LIMIT ? OFFSET ?`;

    const unidades2procces = await this.dataSource.execute(
      unidadesQuery,
      [merchantId, options.hours, options.limit, options.offset]
    );
    // 3. Extraer los IDs de las unidades
    const unidadIds = unidades2procces.filter((p: {unidad_id: number, activo: number; shopify_id: string}) => p.activo === 1).map((u: any) => u.unidad_id);
    // console.log(unidadIds);
    // 3. Extraer los IDs de las unidades
    const inactiveIds = unidades2procces.filter((p: {unidad_id: number, activo: number; shopify_id: string}) => p.activo === 0).map((u: any) => u.shopify_id);


    const total = unidadIds?.length ?? 0;

    if (total === 0) {
      return {products: [], total: 0, inactives: []};
    }

    const productosConRelaciones = await Promise.all(
      unidadIds.map(async (p: any) => {
        try {
          // return await this.findByIdMine(p, null, {merchantId});
          return {unidadId: p, merchantId};
        } catch (error) {
          console.error(`Error al buscar producto ${p}:`, error.message);
          return null; // O un objeto de error personalizado
        }
      })
    );

    // Filtra los resultados nulos (opcional)
    const resultadosValidos = productosConRelaciones.filter(p => p !== null);

    return {
      products: resultadosValidos,
      total: total,
      inactives: inactiveIds
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
    hour: number = 20,
  ): Promise<{actives: ProductosWithRelations[], inactives: number[]}> {
    // Primero obtenemos las unidades relacionadas con el merchant activo

    // -- AND um.activo = 1
    const unidadesActivas = await this.dataSource.execute(
      `SELECT DISTINCT
          u.id AS unidad_id ,um.activo
        FROM
          unidades_merchants um
          JOIN unidades u ON u.id =  um.unidad_id
        AND
          um.merchant_id = 2

          AND u.fecha_actualizacion >= DATE_SUB(
        NOW(),
        INTERVAL ? HOUR)`
      ,
      [merchantId, hour]
    );

    console.log('unidadesActivas', unidadesActivas.length)

    if (!unidadesActivas || unidadesActivas.length === 0) {
      return {actives: [], inactives: []};
    }

    // Extraemos los IDs de las unidades activas
    const activesIds = unidadesActivas.filter((p: {unidad_id: number, activo: boolean;}) => p.activo === true).map((u: any) => u.unidad_id) ?? [];

    // Extraemos los IDs de unidades que fueron desactivadas
    const inactivesIds = unidadesActivas.filter((p: {unidad_id: number, activo: boolean;}) => p.activo === false).map((u: any) => u.unidad_id) ?? [];

    // // Creamos un filtro para buscar los productos por unidad_id
    // const whereClause = {
    //   ...filter?.where,
    //   unidadId: {inq: unidadIds}
    // };

    // // console.log('where', whereClause)
    // const productos = await this.find({
    //   ...filter,
    //   where: whereClause
    // });

    console.log('activesIds', activesIds);
    console.log('inactivesIds', inactivesIds);

    // Si necesitas incluir las relaciones como en findByIdMine
    const productosConRelaciones = await Promise.all(
      activesIds.map((p: any) => this.findByIdMine(p))
    );

    return {actives: productosConRelaciones, inactives: inactivesIds};
  }


  async findByIdMine(
    id: typeof Productos.prototype.id,
    filter?: any,
    options?: any,
  ): Promise<ProductosWithRelations> {

    const {merchantId} = options;
    // console.log('MERCHANT', merchantId)

    try {
      // Obtener el producto base SIN incluir propiedades no mapeadas
      const producto = await super.findById(id, filter);

      // Obtener instituciones educativas
      let institucionesIds: string[] = [];
      // if (producto.unidadId) {

      const instituciones = await this.dataSource.execute(
        `SELECT
            uie.institucion_educativa_id,
            rd.shopify_id
          FROM
            unidades_instituciones_educativas uie
            JOIN instituciones_educativas ie ON uie.institucion_educativa_id = ie.id
            JOIN references_data rd ON rd.referenceable_id = uie.institucion_educativa_id
            AND rd.merchant_id = ?
            AND rd.referenceable_type = 'instituciones_educativas'
            AND uie.unidad_id = ?`,
        [merchantId, id],
      );
      // console.log('ENTRO', JSON.stringify(instituciones));
      institucionesIds = instituciones.map((i: any) => i.shopify_id) || [];

      producto.institucionesEducativasIds = institucionesIds;

      const extraDataQuery = `
          SELECT
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
            (
            SELECT
              rd.shopify_id
            FROM
              references_data rd
            WHERE
              rd.referenceable_id = a.id
              AND rd.referenceable_type = 'areas'
              AND rd.merchant_id = mr.id
            ) AS area_shopify,
            (
            SELECT
              rd.shopify_id
            FROM
              references_data rd
            WHERE
              rd.referenceable_id = f.id
              AND rd.referenceable_type = 'facultades'
              AND rd.merchant_id = mr.id
            ) AS facultad_shopify,
            (
            SELECT
              rd.shopify_id
            FROM
              references_data rd
            WHERE
              rd.referenceable_id = ne.id
              AND rd.referenceable_type = 'niveles_educativos'
              AND rd.merchant_id = mr.id
            ) AS nivel_educativo_shopify,
            (
            SELECT
              rd.shopify_id
            FROM
              references_data rd
            WHERE
              rd.referenceable_id = p.idioma_contenido_id
              AND rd.referenceable_type = 'idiomas'
              AND rd.merchant_id = mr.id
            ) AS idioma_shopify,
            idio.nombre AS idioma_nombre,
            ( SELECT rdu.shopify_id FROM references_data_unidad rdu WHERE rdu.merchant_id = mr.id AND rdu.unidad_id = p.unidad_id ) AS shopify_id,
            ( SELECT rdu.syncro_data FROM references_data_unidad rdu WHERE rdu.merchant_id = mr.id AND rdu.unidad_id = p.unidad_id ) AS syncro_data,
            (
            SELECT
              JSON_ARRAYAGG( rd.shopify_id )
            FROM
              productos_creditos_productos pc
              JOIN creditos_productos cp ON cp.id = pc.credito_producto_id
              JOIN references_data rd ON rd.referenceable_type = 'creditos_productos'
              AND rd.referenceable_id = cp.id
              AND rd.merchant_id = mr.id
            WHERE
              pc.producto_id = p.unidad_id
            ) AS creditos_productos_shopify,
            ut.nombre AS unidad_tiempo,
            md.nombre AS modalidad,
            (
            SELECT
              rd.shopify_id
            FROM
              references_data rd
            WHERE
              rd.referenceable_id = es.id
              AND rd.referenceable_type = 'escuelas'
              AND rd.merchant_id = mr.id
            ) AS escuela_shopify,
            (
            SELECT
              GROUP_CONCAT( CONCAT( pc.numero_creditos, ' ', cp.codigo ) SEPARATOR ', ' )
            FROM
              productos_creditos_productos pc
              JOIN creditos_productos cp ON cp.id = pc.credito_producto_id
            WHERE
              pc.producto_id = p.unidad_id
            ) AS creditos,
            (
            SELECT
              NULLIF(
                JSON_ARRAYAGG(
                NULLIF( im.url, NULL )),
              JSON_ARRAY( NULL ))
            FROM
              unidades_merchants_imagenes ui
              JOIN imagenes im ON ui.imagen_id = im.id
              AND im.tipo_id = 1
              AND ui.merchant_id = mr.id
            WHERE
              ui.unidad_id = p.unidad_id
            ) AS url_imagenes_logos,
            (
            SELECT
              NULLIF(
                JSON_ARRAYAGG(
                NULLIF( im.url, NULL )),
              JSON_ARRAY( NULL ))
            FROM
              unidades_merchants_imagenes ui
              JOIN imagenes im ON ui.imagen_id = im.id
              AND ui.merchant_id = mr.id
              AND im.tipo_id = 2
            WHERE
              ui.unidad_id = p.unidad_id
            ) AS url_imagenes_diplomas,
            (
            SELECT
              NULLIF(
                (
                SELECT
                  JSON_ARRAYAGG( shopify_id )
                FROM
                  (
                  SELECT
                    rfd.shopify_id
                  FROM
                    unidades_unidades_relacionadas uur
                    JOIN productos pd ON uur.unidad_relacionada_id = pd.unidad_id
                    JOIN unidades un ON un.id = pd.unidad_id
                    AND un.id = u.id
                    JOIN unidades_merchants ume ON ume.unidad_id = un.id
                    AND ume.merchant_id = mr.id
                    JOIN references_data_unidad rfd ON rfd.merchant_id = mr.id
                    AND rfd.unidad_id = un.id
                    AND uur.tipo_relacion_id = 1
                    AND un.shopify_id IS NOT NULL
                  ) filtered
                ),
                JSON_ARRAY( NULL )
              )
            ) AS productos_relacionados_idioma,
            (
            SELECT
              NULLIF(
                JSON_ARRAYAGG(
                NULLIF( tmp.shopify_id, NULL )),
              JSON_ARRAY( NULL ))
            FROM
              (
              SELECT DISTINCT
                rd.shopify_id
              FROM
                unidades_unidades_relacionadas uur
                JOIN references_data rd ON rd.referenceable_type = 'idiomas'
                AND rd.referenceable_id = uur.unidad_relacionada_id
                AND rd.merchant_id = mr.id
                AND uur.unidad_id = p.unidad_id
              ) tmp
            ) AS idiomas_relacionados,
            CONCAT_WS(
              ', ',
              'AREAS',
              a.nombre,
              'FACULTADES',
              f.nombre,
              'NIVELES EDUCATIVOS',
              ne.nombre,
              'INSTITUCIONES EDUCATIVAS',
              (
              SELECT
                GROUP_CONCAT( ie.nombre SEPARATOR ', ' )
              FROM
                instituciones_educativas ie
                JOIN unidades_instituciones_educativas uie ON ie.id = uie.institucion_educativa_id
                AND uie.unidad_id = u.id
              )
            ) AS colecciones_shopify,
            mr.nombre AS vendor,
            ne.nombre AS product_type,
            ( SELECT mylxps.url FROM mylxps WHERE mylxps.id = um.mylxp_id ) AS url_mylxp,
            po.nombre AS plat_online_name,
            po.url AS plat_online_url,
            ( SELECT f.nombre FROM familias f JOIN unidades_familias uf ON f.id = uf.familia_id AND uf.unidad_id = u.id ) AS familia,
            ( SELECT f.nombre FROM subfamilias f JOIN unidades_subfamilias uf ON f.id = uf.subfamilia_id AND uf.unidad_id = u.id ) AS subfamilia,
            (
            SELECT
              ie.nombre AS inst_educ_propietaria
            FROM
              unidades_instituciones_educativas uie
              JOIN instituciones_educativas ie ON ie.id = uie.institucion_educativa_id
              AND uie.unidad_id = u.id
              AND uie.propietaria = 1
              LIMIT 1
            ) AS inst_educ_propietaria,
            p.codigo_afo_educalab AS cod_scorm,
            ( SELECT umi.url_pdf FROM unidades_merchants_idiomas umi WHERE umi.unidad_id = p.unidad_id ) AS pdf_temario,
            p.descripcion_seo,
            um.activo,
						CONCAT(p.duracion_tutorizacion,' ',(SELECT ute.nombre FROM unidades_tiempo ute WHERE ute.id =p.duracion_tutorizacion_unidad_tiempo_id)) as tutorizacion
          FROM
            productos p
            LEFT JOIN unidades u ON p.unidad_id = u.id
            LEFT JOIN areas a ON u.area_id = a.id
            LEFT JOIN facultades f ON u.facultad_id = f.id
            LEFT JOIN niveles_educativos ne ON u.nivel_educativo_id = ne.id
            LEFT JOIN idiomas idio ON p.idioma_contenido_id = idio.id
            LEFT JOIN unidades_tiempo ut ON ut.id = p.unidad_tiempo_id
            LEFT JOIN modalidades md ON md.id = p.modalidad_id
            LEFT JOIN escuelas es ON es.id = u.escuela_id
            LEFT JOIN plataformas_online po ON po.id = p.plataforma_online_id
            JOIN merchants mr ON mr.id = ?
            JOIN unidades_merchants um ON um.unidad_id = u.id
            AND um.merchant_id = mr.id
          WHERE
            p.unidad_id = ?;`;
      // AND um.activo=TRUE
      // console.log(extraDataQuery)

      const extraData = await this.dataSource.execute(
        extraDataQuery,
        [merchantId, id],
      );

      const DEFAULT_EXTRADATA = {
        area_shopify: null,
        facultad_shopify: null,
        nivel_educativo_shopify: null,
        idioma_shopify: null
      };
      const {
        tutorizacion,
        activo,
        pdf_temario,
        descripcion_seo,
        familia,
        subfamilia,
        inst_educ_propietaria,
        cod_scorm,
        url_mylxp,
        plat_online_name,
        plat_online_url,
        product_type,
        vendor,
        shopify_id,
        syncro_data,
        colecciones_shopify,
        idiomas_relacionados,
        productos_relacionados_idioma,
        url_imagenes_diplomas,
        url_imagenes_logos,
        creditos,
        idioma_nombre,
        escuela_shopify,
        modalidad,
        area_shopify,
        facultad_shopify,
        nivel_educativo_shopify,
        idioma_shopify,
        creditos_productos_shopify,
        unidad_tiempo
      } = extraData[0] ?? DEFAULT_EXTRADATA;

      producto.extraData = {
        tutorizacion,
        activo,
        pdf_temario,
        descripcion_seo,
        familia,
        subfamilia,
        inst_educ_propietaria,
        cod_scorm, url_mylxp,
        plat_online_name,
        plat_online_url,
        product_type,
        vendor,
        shopify_id,
        syncro_data,
        colecciones_shopify,
        idiomas_relacionados,
        productos_relacionados_idioma,
        url_imagenes_diplomas,
        url_imagenes_logos,
        creditos,
        idioma_nombre,
        escuela_shopify,
        modalidad,
        area_shopify,
        facultad_shopify,
        nivel_educativo_shopify,
        idioma_shopify,
        creditos_productos_shopify,
        unidad_tiempo
      };

      producto.shopifyId = shopify_id ?? undefined;

      // }

      // Retornar un objeto combinado sin modificar el modelo original
      return producto;

    } catch (error) {
      console.log('🔥 ERROR', error.message);
      throw error;
    }
  }



}
