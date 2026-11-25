/**
 * Puerto de persistencia consumido por los casos de uso.
 *
 * Esta es la unica frontera de compatibilidad con el cliente actual. Los
 * modulos de aplicacion importan este contrato y la raiz de composicion les
 * inyecta el adaptador Prisma. Al sustituir el ORM, el cambio queda concentrado
 * aqui y en infraestructura, no repartido entre los casos de uso.
 */
import type { Db, Tx } from '../db/prisma.js';

export type PersistencePort = Db;
export type TransactionPort = Tx;
