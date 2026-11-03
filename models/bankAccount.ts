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

class BankAccount extends Model<
InferAttributes<BankAccount>,
InferCreationAttributes<BankAccount>
> {
  declare id: CreationOptional<number>
  declare UserId: number
  declare type: 'CHEQUING' | 'SAVINGS' | 'TFSA' | 'RRSP'
  declare nickname: string
  declare accountNumber: string
  declare balance: CreationOptional<number>
}

const BankAccountModelInit = (sequelize: Sequelize) => {
  BankAccount.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      UserId: DataTypes.INTEGER,
      type: {
        type: DataTypes.ENUM('CHEQUING', 'SAVINGS', 'TFSA', 'RRSP'),
        allowNull: false
      },
      nickname: DataTypes.STRING,
      accountNumber: DataTypes.STRING,
      balance: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      }
    },
    {
      tableName: 'BankAccounts',
      sequelize
    }
  )
}

export { BankAccount as BankAccountModel, BankAccountModelInit }
