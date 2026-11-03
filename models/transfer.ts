/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import {
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  DataTypes,
  type CreationOptional,
  type Sequelize
} from 'sequelize'

class Transfer extends Model<
InferAttributes<Transfer>,
InferCreationAttributes<Transfer>
> {
  declare id: CreationOptional<number>
  declare fromAccountId: number
  declare toAccountId: number | null
  declare recipientEmail: string | null
  declare amount: number
  declare memo: string | null
  declare createdAt: CreationOptional<Date>
}

const TransferModelInit = (sequelize: Sequelize) => {
  Transfer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fromAccountId: DataTypes.INTEGER,
      toAccountId: DataTypes.INTEGER,
      recipientEmail: DataTypes.STRING,
      amount: DataTypes.FLOAT,
      memo: DataTypes.STRING,
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'Transfers',
      timestamps: false,
      sequelize
    }
  )
}

export { Transfer as TransferModel, TransferModelInit }
