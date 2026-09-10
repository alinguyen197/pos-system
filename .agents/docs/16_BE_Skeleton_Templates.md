# Skeleton Templates — Backend (Node.js + Express + TypeScript)

| Hạng mục   | Nội dung                                                      |
| :--------- | :------------------------------------------------------------ |
| Hệ thống   | Coffee Trade Management System                                |
| Phiên bản  | 1.1                                                           |
| Tech Stack | Node.js + Express (TypeScript) + Sequelize (PostgreSQL) + Joi |

---

## 1. Tổng quan

Các **skeleton template** chuẩn cho Backend bằng **TypeScript**. Dùng cho phân tầng:
`Route` $rightarrow$ `Middleware` $rightarrow$ `Controller` $rightarrow$ `Service` $rightarrow$ `Model`.

---

## 2. Model (`[module].model.ts`)

Dùng cho: `src/models/[module].model.ts`

```typescript
import { Table, Column, Model, DataType, Default, PrimaryKey } from 'sequelize-typescript'

@Table({ tableName: '[table_name_plural]', timestamps: true, underscored: true })
export class [MODULE_NAME] extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string

  @Column({ type: DataType.STRING(200), allowNull: false })
  name!: string

  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'is_deleted' })
  isDeleted!: boolean

  @Column({ type: DataType.UUID, field: 'created_by' })
  createdBy!: string

  @Column({ type: DataType.UUID, field: 'updated_by' })
  updatedBy!: string
}

export default [MODULE_NAME]
```

---

## 3. Migration (`YYYYMMDDHHMMSS-create-[table-name].js`)

```javascript
"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("[table_name_plural]", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: { type: Sequelize.STRING(200), allowNull: false },
      is_deleted: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex("[table_name_plural]", ["is_deleted"], {
      name: "idx_[table]_is_deleted",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("[table_name_plural]");
  },
};
```

---

## 4. Validation (`[module].validation.ts`)

Dùng cho: `src/validations/[module].validation.ts`

```typescript
import Joi from 'joi'

export const create[MODULE_NAME]Schema = Joi.object({
  name: Joi.string().max(200).required(),
  status: Joi.string().valid('active', 'inactive').default('active')
})

export const update[MODULE_NAME]Schema = Joi.object({
  name: Joi.string().max(200),
  status: Joi.string().valid('active', 'inactive')
})

export const search[MODULE_NAME]Schema = Joi.object({
  searchConditions: Joi.object({
    name: Joi.string().allow('').max(200)
  }).default({}),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20)
  }).default({})
})
```

---

## 5. Service (`[module].service.ts`)

Dùng cho: `src/services/[module].service.ts`

```typescript
import [MODULE_NAME] from '../models/[module].model'

class [MODULE_NAME]Service {
  async search(body: any) {
    const { searchConditions, pagination } = body
    const page = pagination?.page || 1
    const pageSize = pagination?.pageSize || 20
    const where: any = { isDeleted: false }

    if (searchConditions?.name) {
      where.name = searchConditions.name
    }

    const { count, rows } = await [MODULE_NAME].findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize
    })

    return {
      items: rows,
      pagination: { page, pageSize, totalRecords: count, totalPages: Math.ceil(count / pageSize) }
    }
  }

  async getById(id: string) {
    const record = await [MODULE_NAME].findByPk(id)
    if (!record || record.isDeleted) throw { statusCode: 404, message: 'Not Found' }
    return record
  }

  async create(data: any, userId: string) {
    return [MODULE_NAME].create({ ...data, createdBy: userId, updatedBy: userId })
  }

  async update(id: string, data: any, userId: string) {
    const record = await this.getById(id)
    return record.update({ ...data, updatedBy: userId })
  }

  async remove(id: string, userId: string) {
    const record = await this.getById(id)
    return record.update({ isDeleted: true, updatedBy: userId })
  }
}

export default new [MODULE_NAME]Service()
```

---

## 6. Controller (`[module].controller.ts`)

Dùng cho: `src/controllers/[module].controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express'
import [module]Service from '../services/[module].service'

export const search = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await [module]Service.search(req.body)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await [module]Service.getById(req.params.id)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await [module]Service.create(req.body, (req as any).user?.id)
    res.status(201).json({ success: true, data })
  } catch (err) { next(err) }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await [module]Service.update(req.params.id, req.body, (req as any).user?.id)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await [module]Service.remove(req.params.id, (req as any).user?.id)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { next(err) }
}
```

---

## 7. Route (`[module].routes.ts`)

```typescript
import { Router } from "express";
import * as controller from "../controllers/[module].controller";

const router = Router();

router.post("/[module-plural]/search", controller.search);
router.get("/[module-plural]/:id", controller.getById);
router.post("/[module-plural]", controller.create);
router.put("/[module-plural]/:id", controller.update);
router.delete("/[module-plural]/:id", controller.remove);

export default router;
```

---

## 8. Unit Test (`[module].service.test.ts`)

```typescript
import [module]Service from '../../../src/services/[module].service'
import [MODULE_NAME] from '../../../src/models/[module].model'

jest.mock('../../../src/models/[module].model')

describe('[MODULE_NAME]Service', () => {
  it('should return paginated items', async () => {
    ;([MODULE_NAME].findAndCountAll as jest.Mock).mockResolvedValue({ count: 1, rows: [{ id: '1', name: 'Test' }] })
    const res = await [module]Service.search({})
    expect(res.items).toHaveLength(1)
  })
})
```
